import { action } from "./_generated/server";
import { v } from "convex/values";
import * as cheerio from 'cheerio';

export const scrapeUntappdBeer = action({
    args: {
        untappdUrl: v.string(),
    },
    handler: async (ctx, args) => {
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

        // --- 2. חילוץ הנתונים בעזרת Cheerio (הקוד שלך!) ---
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

        } catch (error: any) {
            console.error("Cheerio parsing failed:", error);
            throw new Error("Failed to parse beer HTML structure. Untappd might have changed their DOM.");
        }
    }
});