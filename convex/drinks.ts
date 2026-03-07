import {action, mutation, query} from "./_generated/server";
import { v, ConvexError } from "convex/values";
import * as cheerio from 'cheerio';
import { requireAuth, requireEventAccess } from "./helpers";

export const scrapeUntappdBeer = action({
    args: {
        untappdUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // Auth check — prevents unauthenticated callers from burning Firecrawl quota
        await requireAuth(ctx);

        // // URL validation — only allow Untappd beer pages to prevent SSRF/abuse
        // if (!args.untappdUrl.startsWith("https://untappd.com/") || !args.untappdUrl.startsWith("https://untp.beer/")) {
        //     throw new Error("כתובת URL חייבת להיות מדף בירה של Untappd (https://untappd.com/b/...)");
        // }

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
                url: args.untappdUrl,
                formats: ["html"], // מבקשים רק HTML עכשיו!
                onlyMainContent: false // חשוב להשאיר false כדי לא לאבד אלמנטים ב-DOM
            })
        };

        const response = await fetch(apiUrl, options);
        if (!response.ok) {
            throw new Error(`Firecrawl API Error: ${await response.text()}`);
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
            if (!beerName) throw new Error('Could not extract beer name');

            // חילוץ שם המבשלה
            const breweryName = $('.brewery a').first().text().trim();

            // חילוץ סגנון
            const style = $('.basic .name p.style').first().text().trim();

            // חילוץ דירוג
            let rating = 0;
            const dataRating = $('.caps').attr('data-rating');
            if (dataRating) {
                rating = parseFloat(dataRating);
            } else {
                const numText = $('.num').first().text().trim();
                const ratingMatch = numText.match(/\(([\d.]+)\)/);
                if (ratingMatch) rating = parseFloat(ratingMatch[1]);
            }

            // חילוץ ABV
            let abv = 0;
            const abvText = $('.abv').first().text().trim();
            const abvMatch = abvText.match(/([\d.]+)%/);
            if (abvMatch) abv = parseFloat(abvMatch[1]);

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
            throw new Error("Failed to parse beer HTML structure. Untappd might have changed their DOM.");
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
