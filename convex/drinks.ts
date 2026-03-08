import {action, mutation, query} from "./_generated/server";
import { v, ConvexError } from "convex/values";
import * as cheerio from 'cheerio';
import { requireAuth, requireEventAccess } from "./helpers";

const ALLOWED_UNTAPPD_HOSTS = new Set([
    'untappd.com',
    'www.untappd.com',
    'untp.beer',
    'www.untp.beer',
]);

function validateUntappdUrl(rawUrl: string): string {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        throw new ConvexError('הלינק לא תקין. נסה להדביק כתובת מלאה של Untappd.');
    }

    if (parsedUrl.protocol !== 'https:') {
        throw new ConvexError('הלינק חייב להתחיל ב-https://');
    }

    if (!ALLOWED_UNTAPPD_HOSTS.has(parsedUrl.hostname)) {
        throw new ConvexError('אפשר להדביק רק לינק של Untappd.');
    }

    const isUntappdBeerPage =
        (parsedUrl.hostname === 'untappd.com' || parsedUrl.hostname === 'www.untappd.com') &&
        parsedUrl.pathname.startsWith('/b/');

    const isUntpShortLink =
        (parsedUrl.hostname === 'untp.beer' || parsedUrl.hostname === 'www.untp.beer') &&
        parsedUrl.pathname.length > 1;

    if (!isUntappdBeerPage && !isUntpShortLink) {
        throw new ConvexError('הלינק חייב להיות לדף בירה ב-Untappd (https://untappd.com/b/...).');
    }

    return parsedUrl.toString();
}

export const scrapeUntappdBeer = action({
    args: {
        untappdUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // Auth check — prevents unauthenticated callers from burning Firecrawl quota
        await requireAuth(ctx);

        const untappdUrl = validateUntappdUrl(args.untappdUrl.trim());

        // --- 1. משיכת ה-HTML דרך Firecrawl (טוקן 1 בלבד) ---
        const apiUrl = 'https://api.firecrawl.dev/v2/scrape';
        const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

        if (!firecrawlApiKey) {
            throw new Error("Missing FIRECRAWL_API_KEY");
        }

        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: untappdUrl,
                formats: ["html"], // מבקשים רק HTML עכשיו!
                onlyMainContent: false // חשוב להשאיר false כדי לא לאבד אלמנטים ב-DOM
            })
        };

        const response = await fetch(apiUrl, options);
        if (!response.ok) {
            const responseText = await response.text();
            console.error('Firecrawl scrape request failed:', response.status, responseText);
            throw new Error('Firecrawl scrape request failed');
        }

        const data = await response.json();
        const html = data.data?.html;

        if (!html) {
            throw new Error("No HTML returned from Firecrawl");
        }

        // --- 2. חילוץ הנתונים בעזרת Cheerio ---
        const $ = cheerio.load(html);

        try {
            // חילוץ שם הבירה
            const beerName = $('.basic .name h1').first().text().trim();
            if (!beerName) throw new ConvexError('לא הצלחנו לחלץ את שם הבירה מהדף. נסה לינק אחר.');

            // חילוץ שם המבשלה
            const breweryName = $('.brewery a').first().text().trim();

            // חילוץ סגנון
            const style = $('.basic .name p.style').first().text().trim();

            // חילוץ דירוג
            let rating: number | undefined;
            const dataRating = $('.caps').attr('data-rating');
            if (dataRating) {
                const parsedRating = parseFloat(dataRating);
                if (Number.isFinite(parsedRating)) {
                    rating = parsedRating;
                }
            } else {
                const numText = $('.num').first().text().trim();
                const ratingMatch = numText.match(/\(([\d.]+)\)/);
                if (ratingMatch) {
                    const parsedRating = parseFloat(ratingMatch[1]);
                    if (Number.isFinite(parsedRating)) {
                        rating = parsedRating;
                    }
                }
            }

            // חילוץ ABV
            let abv: number | undefined;
            const abvText = $('.abv').first().text().trim();
            const abvMatch = abvText.match(/([\d.]+)%/);
            if (abvMatch) {
                const parsedAbv = parseFloat(abvMatch[1]);
                if (Number.isFinite(parsedAbv)) {
                    abv = parsedAbv;
                }
            }

            // חילוץ תמונה
            let beerImageURL = $('.label.image-big').attr('data-image');
            if (!beerImageURL) {
                beerImageURL = $('.label.image-big img').attr('src');
            }

            return {
                beerName,
                breweryName,
                rating,
                abv,
                style,
                beerImageURL
            };

        } catch (error: unknown) {
            console.error("Cheerio parsing failed:", error);
            if (error instanceof ConvexError) {
                throw error;
            }

            throw new ConvexError('לא הצלחנו לנתח את דף הבירה. נסה לינק אחר או נסה שוב מאוחר יותר.');
        }
    }
});

export const addDrink = mutation({
    args: {
        eventId: v.id("events"),
        beerName: v.string(),
        breweryName: v.optional(v.string()),
        price: v.number(),
        abv: v.optional(v.number()),
        rating: v.optional(v.number()),
        style: v.optional(v.string()),
        beerImageURL: v.optional(v.string()),
        untappdLink: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);

        // Server-side price validation — client-side min="0" is bypassable
        if (args.price < 0) throw new ConvexError("המחיר חייב להיות חיובי");

        await requireEventAccess(ctx, args.eventId, userId);

        return await ctx.db.insert("drinks", {
            eventId: args.eventId,
            payerId: userId,
            beerName: args.beerName,
            breweryName: args.breweryName,
            price: args.price,
            abv: args.abv,
            rating: args.rating,
            style: args.style,
            beerImageURL: args.beerImageURL,
            untappdLink: args.untappdLink,
            consumers: [userId],
        });
    }
});

export const getDrinksByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);

        // Verify event exists and user is authorized — each endpoint must auth independently
        await requireEventAccess(ctx, args.eventId, userId);

        return await ctx.db
            .query("drinks")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .order("desc")
            .collect();
    }
});
