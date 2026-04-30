#!/bin/bash
# TaskFlow Dev Setup Script

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Backend installation failed"
    exit 1
fi

echo ""
echo "Installing frontend dependencies..."
cd ../frontend

# Try to install with registry workaround
npm install --registry https://registry.npmjs.org/ || npm install

if [ $? -ne 0 ]; then
    echo "Frontend installation had issues but continuing..."
fi

cd ..
echo ""
echo "=========================================="
echo "Setup complete! To start development:"
echo ""
echo "Terminal 1: npm run dev:backend"
echo "Terminal 2: npm run dev:frontend"
echo "=========================================="
