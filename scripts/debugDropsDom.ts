import https from "node:https";
import * as cheerio from "cheerio";

const URL =
    "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";

function fetchText(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
                    return;
                }
                res.setEncoding("utf8");
                let buf = "";
                res.on("data", (chunk) => (buf += chunk));
                res.on("end", () => resolve(buf));
            })
            .on("error", reject);
    });
}

function norm(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

async function main(): Promise<void> {
    const html = await fetchText(URL);
    const $ = cheerio.load(html);

    console.log("HTML length:", html.length);
    console.log("Body text prefix:", norm($("body").text()).slice(0, 2000));

    const needle = "blueprint/item drops by blueprint/item";

    const hits: Array<{ tag: string; text: string }> = [];
    $("h1,h2,h3,h4,h5,h6,p,div,section,article").each((_, el) => {
        const tag = String(el.tagName ?? "").toLowerCase();
        const text = norm($(el).text());
        if (text.toLowerCase().includes(needle)) {
            hits.push({ tag, text: text.slice(0, 200) });
        }
    });

    console.log("Needle hits:", hits.length);
    for (const h of hits.slice(0, 50)) {
        console.log(`- <${h.tag}> ${h.text}`);
    }

    console.log("Table count:", $("table").length);
    console.log("TR count:", $("tr").length);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
