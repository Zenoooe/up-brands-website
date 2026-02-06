export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Simple regex to find Behance project images
    // Behance usually serves high-res images in <img src="..." /> inside project modules
    // We look for common patterns. 
    // Pattern 1: https://mir-s3-cdn-cf.behance.net/project_modules/fs/
    // Pattern 2: https://mir-s3-cdn-cf.behance.net/project_modules/1400/
    // We want the largest available, usually 'fs' (full screen) or '1400'.
    
    // Let's find all project_modules links
    const regex = /https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[a-zA-Z0-9]+\/[a-zA-Z0-9_\.]+/g;
    const matches = html.match(regex) || [];

    // Filter and deduplicate
    const uniqueImages = [...new Set(matches)];
    
    // Prioritize high-res images (fs > 1400 > max_1200 > disp)
    // Actually, we just want to return a clean list and let frontend pick or just take all unique ones.
    // But usually we want 'fs' or '1400' versions.
    
    const highResImages = uniqueImages.filter(img => 
      img.includes('/fs/') || 
      img.includes('/1400/') || 
      img.includes('/max_1200/')
    );

    // If we found high res ones, use those. Otherwise fallback to whatever we found.
    const finalImages = highResImages.length > 0 ? highResImages : uniqueImages;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ images: finalImages });

  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: 'Failed to scrape Behance', details: error.message });
  }
}