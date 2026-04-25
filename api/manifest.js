export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    name: "TRPG Sheet Dice",
    version: "1.0.0",
    manifest_version: 1,
    action: {
      title: "TRPG Sheet Dice",
      icon: "/icon.svg",
      popover: "/",
      height: 500,
      width: 320
    }
  });
}
