#!/bin/bash
FILES=("apps/web/src/app/dashboard/page.tsx" "apps/web/src/components/ui/core.tsx")
for FILE in "${FILES[@]}"; do
  sed -i '' 's/bg-black\/5/bg-onyx\/5/g' $FILE
  sed -i '' 's/bg-black\/10/bg-onyx\/10/g' $FILE
done
echo "Done"
