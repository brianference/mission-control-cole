#!/bin/bash
# Fix remaining 50 linting errors in mission-control-cole
set -e

echo "🔧 Fixing remaining 50 TypeScript linting errors..."
cd /root/.openclaw/workspace/mission-control-cole

# Fix 1: CostTracking.tsx - Replace @ts-ignore with @ts-expect-error
echo "📝 Fixing @ts-ignore comments..."
sed -i 's/@ts-ignore/@ts-expect-error/g' src/pages/CostTracking.tsx

# Fix 2: Logs.tsx - Remove unused variable
echo "📝 Fixing unused variable in Logs.tsx..."
sed -i 's/} catch (err) {/} catch {/' src/pages/Logs.tsx

# Fix 3: AlertCenter.tsx - Add comment to empty block
echo "📝 Fixing empty block in AlertCenter.tsx..."
sed -i '56s/{}/{ \/\/ Empty catch block intentional }/' src/pages/AlertCenter.tsx

echo "✅ Simple fixes applied!"
echo ""
echo "Now running remaining manual fixes for complex issues..."
