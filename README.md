# Mission Control Dashboard

Real-time budget tracking and cost optimization for OpenClaw AI usage.

## Features

- **Budget Tracking**: Monitor Daily/Weekly/Monthly AI usage costs
- **Real-time Updates**: Auto-refresh every 5 minutes
- **Cost Optimization**: See monthly savings vs GPT-4 pricing
- **Mobile-First**: Optimized for iPhone/Android
- **Dark/Light Mode**: Automatic theme switching

## Budget Limits

- **Daily**: $100
- **Weekly**: $500  
- **Monthly**: $2,000

Tap the ⚙️ icon next to "Budget" to customize limits.

## API Integration

Connects to OpenClaw `/api/usage` endpoint for real-time data.

If API is unavailable, falls back to demo mode with mock data.

## Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

## Live URL

https://mission-control-dashboard.pages.dev

## Screenshot Matches

- ✅ "Welcome back, Brian"
- ✅ Current date display
- ✅ Budget tabs (Daily/Weekly/Monthly)
- ✅ Usage display ($0.00 / $500)
- ✅ Progress bar
- ✅ Percentage + remaining amount
- ✅ Cost Optimization section
- ✅ Monthly savings ($729.50)

## Technical Stack

- Pure HTML/CSS/JavaScript (no build step)
- Mobile-optimized (viewport-fit=cover)
- Dark mode by default
- Auto-refresh every 5 min
