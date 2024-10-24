// api/env.js
module.exports = (req, res) => {
  // Read environment variable from Vercel
  const apiKey = process.env.NEXT_PUBLIC_NAME;
  
  // Send it back as a JSON response
  res.status(200).json({ apiKey });
};
