#!/bin/bash
FILES=("apps/web/src/app/dashboard/page.tsx" "apps/web/src/components/ui/core.tsx")

for FILE in "${FILES[@]}"; do
  sed -i '' 's/bg-\[#FDFBF7\]/bg-pearl/g' $FILE
  sed -i '' 's/text-\[#2C2C2A\]/text-onyx/g' $FILE
  sed -i '' 's/text-\[#6A6A65\]/text-stone/g' $FILE
  sed -i '' 's/border-\[#EFECE6\]/border-oatmeal/g' $FILE
  sed -i '' 's/bg-\[#FFFFFF\]/bg-white/g' $FILE
  sed -i '' 's/bg-\[#3A4A3F\]/bg-forest/g' $FILE
  sed -i '' 's/hover:bg-\[#2E3A32\]/hover:bg-forest-dark/g' $FILE
  sed -i '' 's/text-\[#3A4A3F\]/text-forest/g' $FILE
  sed -i '' 's/text-\[#8A3C3C\]/text-crimson/g' $FILE
  sed -i '' 's/bg-\[#F9EAEA\]/bg-danger-bg/g' $FILE
  sed -i '' 's/border-\[#F4DADA\]/border-danger-border/g' $FILE
  sed -i '' 's/bg-\[#F4DADA\]\/50/bg-danger-border\/50/g' $FILE
  sed -i '' 's/border-\[#8A3C3C\]\/10/border-crimson\/10/g' $FILE
  sed -i '' 's/hover:bg-\[#8A3C3C\]\/10/hover:bg-crimson\/10/g' $FILE
  sed -i '' 's/hover:text-\[#2C2C2A\]/hover:text-onyx/g' $FILE
  sed -i '' 's/hover:bg-\[#EFECE6\]\/50/hover:bg-oatmeal\/50/g' $FILE
  sed -i '' 's/border-\[#3A4A3F\]\/20/border-forest\/20/g' $FILE
  sed -i '' 's/border-\[#3A4A3F\]\/30/border-forest\/30/g' $FILE
  sed -i '' 's/hover:border-\[#3A4A3F\]\/30/hover:border-forest\/30/g' $FILE
  sed -i '' 's/focus:border-\[#3A4A3F\]/focus:border-forest/g' $FILE
  sed -i '' 's/focus:border-\[#8A3C3C\]/focus:border-crimson/g' $FILE
  sed -i '' 's/border-\[#8A3C3C\]/border-crimson/g' $FILE
  sed -i '' 's/bg-\[#2C2C2A\]\/40/bg-onyx\/40/g' $FILE
  sed -i '' 's/bg-\[#F0F0EE\]/bg-ash/g' $FILE
  sed -i '' 's/text-\[#5E5E5A\]/text-graphite/g' $FILE
  sed -i '' 's/placeholder:text-\[#6A6A65\]\/50/placeholder:text-stone\/50/g' $FILE
done
echo "Done"
