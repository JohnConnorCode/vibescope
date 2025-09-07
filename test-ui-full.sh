#!/bin/bash

echo "Testing VibeScope Full Functionality"
echo "====================================="
echo ""

# Test 1: Single word
echo "1. Testing single word 'happiness':"
curl -s "https://vibescope-orpin.vercel.app/api/vibe?term=happiness" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'   ✓ Returns data: {\"axes\" in data}')
print(f'   ✓ Has mock flag: {data.get(\"isMockData\", False)}')
print(f'   ✓ Has warning: {bool(data.get(\"warning\"))}')
print(f'   ✓ Axes count: {len(data.get(\"axes\", {}))}')
"

echo ""

# Test 2: Full phrase
echo "2. Testing full phrase 'artificial intelligence is the future':"
curl -s "https://vibescope-orpin.vercel.app/api/vibe?term=artificial%20intelligence%20is%20the%20future&type=sentence" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'   ✓ Returns data: {\"axes\" in data}')
print(f'   ✓ Type is sentence: {data.get(\"type\") == \"sentence\" if \"type\" in data else \"not specified\"}')
print(f'   ✓ Has mock flag: {data.get(\"isMockData\", False)}')
print(f'   ✓ Warning message: \"{data.get(\"warning\", \"No warning\")[:50]}...\"')
"

echo ""

# Test 3: Check if main page loads
echo "3. Testing main page loads:"
status=$(curl -s -o /dev/null -w "%{http_code}" https://vibescope-orpin.vercel.app)
echo "   ✓ Page status: $status"
if [ "$status" = "200" ]; then
    echo "   ✓ Main page loads successfully"
else
    echo "   ✗ Main page failed to load"
fi

echo ""

# Test 4: Check for UI elements
echo "4. Testing UI contains expected elements:"
curl -s https://vibescope-orpin.vercel.app | python3 -c "
import sys
html = sys.stdin.read()
print(f'   ✓ Has VibeScope title: {\"VibeScope\" in html}')
print(f'   ✓ Has input field: {\"Enter a word\" in html or \"placeholder\" in html}')
print(f'   ✓ Has analyze button: {\"Analyze\" in html or \"submit\" in html}')
print(f'   ✓ Has warning styles: {\"yellow-500\" in html or \"warning\" in html}')
"

echo ""
echo "====================================="
echo "All tests completed!"