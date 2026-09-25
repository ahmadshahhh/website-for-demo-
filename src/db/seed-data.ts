/**
 * First-run content. Only inserted into an EMPTY database — after that the
 * restaurant owner manages everything from the admin panel.
 * Prices are in fils (1 KWD = 1000 fils).
 */

export const seedCategories = [
  { slug: "starters", nameEn: "Starters", nameAr: "المقبلات" },
  { slug: "main-course", nameEn: "Main Course", nameAr: "الأطباق الرئيسية" },
  { slug: "burgers", nameEn: "Burgers", nameAr: "البرغر" },
  { slug: "pizza", nameEn: "Pizza", nameAr: "البيتزا" },
  { slug: "rice", nameEn: "Rice", nameAr: "الأرز" },
  { slug: "drinks", nameEn: "Drinks", nameAr: "المشروبات" },
  { slug: "desserts", nameEn: "Desserts", nameAr: "الحلويات" },
];

type SeedItem = {
  slug: string;
  category: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  tags?: string;
  isAvailable?: boolean;
};

export const seedItems: SeedItem[] = [
  // Starters
  {
    slug: "hummus-beiruti",
    category: "starters",
    nameEn: "Hummus Beiruti",
    nameAr: "حمص بيروتي",
    descriptionEn: "Silky chickpea purée with tahini, garlic, parsley, a pool of olive oil and warm saj bread.",
    descriptionAr: "حمص ناعم بالطحينة والثوم والبقدونس مع زيت الزيتون وخبز الصاج الدافئ.",
    price: 1250,
    tags: "veg",
  },
  {
    slug: "garden-salad",
    category: "starters",
    nameEn: "Fresh Garden Salad",
    nameAr: "سلطة الحديقة الطازجة",
    descriptionEn: "Crisp lettuce, tomato, cucumber and peppers with a lemon-sumac dressing.",
    descriptionAr: "خس مقرمش وطماطم وخيار وفلفل مع صلصة الليمون والسماق.",
    price: 1500,
    tags: "veg",
  },
  {
    slug: "lentil-soup",
    category: "starters",
    nameEn: "Red Lentil Soup",
    nameAr: "شوربة العدس",
    descriptionEn: "Slow-simmered red lentils with cumin, lemon and crunchy croutons.",
    descriptionAr: "عدس أحمر مطهو ببطء مع الكمون والليمون وقطع الخبز المحمص.",
    price: 1000,
    tags: "veg",
  },
  {
    slug: "mezze-platter",
    category: "starters",
    nameEn: "Mezze Sharing Platter",
    nameAr: "طبق المزة المشكل",
    descriptionEn: "Hummus, fresh vegetables, olives and warm pita — made for sharing.",
    descriptionAr: "حمص وخضار طازجة وزيتون مع خبز البيتا الدافئ، مثالي للمشاركة.",
    price: 2750,
    tags: "veg",
  },
  {
    slug: "crispy-samosas",
    category: "starters",
    nameEn: "Crispy Samosas",
    nameAr: "سمبوسة مقرمشة",
    descriptionEn: "Golden pastries filled with spiced potato and peas, with mint chutney.",
    descriptionAr: "معجنات ذهبية محشوة بالبطاطا والبازلاء المتبلة مع صلصة النعناع.",
    price: 1250,
    tags: "veg",
  },

  // Main course
  {
    slug: "mixed-grill-platter",
    category: "main-course",
    nameEn: "Mixed Grill Platter",
    nameAr: "طبق المشاوي المشكلة",
    descriptionEn: "Lamb kebab, shish tawook and lamb chops over charcoal, with grilled vegetables, garlic sauce and bread.",
    descriptionAr: "كباب لحم وشيش طاووق وريش غنم على الفحم مع خضار مشوية وثومية وخبز.",
    price: 6500,
  },
  {
    slug: "shish-tawook",
    category: "main-course",
    nameEn: "Shish Tawook Plate",
    nameAr: "طبق شيش طاووق",
    descriptionEn: "Yoghurt-marinated chicken skewers, fries, pickles and toum.",
    descriptionAr: "أسياخ دجاج متبلة باللبن مع بطاطا مقلية ومخلل وثومية.",
    price: 3750,
  },
  {
    slug: "saffron-butter-chicken",
    category: "main-course",
    nameEn: "Saffron Butter Chicken",
    nameAr: "دجاج بالزبدة والزعفران",
    descriptionEn: "Our signature — tender chicken in a saffron-tomato butter sauce, served with basmati rice.",
    descriptionAr: "طبقنا المميز: دجاج طري بصلصة الزبدة والطماطم والزعفران مع أرز بسمتي.",
    price: 3950,
    tags: "signature",
  },
  {
    slug: "grilled-hammour",
    category: "main-course",
    nameEn: "Grilled Hammour Fillet",
    nameAr: "فيليه هامور مشوي",
    descriptionEn: "Local hammour with lemon-herb butter, saffron rice and salad.",
    descriptionAr: "هامور محلي بزبدة الليمون والأعشاب مع أرز بالزعفران وسلطة.",
    price: 5250,
    isAvailable: false,
  },

  // Burgers
  {
    slug: "yard-classic-burger",
    category: "burgers",
    nameEn: "Yard Classic Burger",
    nameAr: "برغر الساحة الكلاسيكي",
    descriptionEn: "Angus beef patty, cheddar, caramelised onion, pickles and house sauce in a brioche bun.",
    descriptionAr: "قطعة لحم أنغس مع شيدر وبصل مكرمل ومخلل وصلصة البيت في خبز البريوش.",
    price: 2950,
  },
  {
    slug: "saffron-chicken-burger",
    category: "burgers",
    nameEn: "Crispy Saffron Chicken Burger",
    nameAr: "برغر الدجاج المقرمش بالزعفران",
    descriptionEn: "Buttermilk fried chicken, saffron mayo, slaw and jalapeños.",
    descriptionAr: "دجاج مقلي مقرمش مع مايونيز الزعفران وكول سلو وهالبينو.",
    price: 2750,
    tags: "spicy",
  },
  {
    slug: "double-cheese-burger",
    category: "burgers",
    nameEn: "Double Cheese Burger",
    nameAr: "دبل تشيز برغر",
    descriptionEn: "Two smashed beef patties, double cheddar, pickles and smoky house sauce.",
    descriptionAr: "قطعتا لحم مع شيدر مضاعف ومخلل وصلصة البيت المدخنة.",
    price: 3500,
  },
  {
    slug: "garden-veggie-burger",
    category: "burgers",
    nameEn: "Garden Veggie Burger",
    nameAr: "برغر الخضار",
    descriptionEn: "Crispy vegetable patty, lettuce, tomato and herb mayo.",
    descriptionAr: "قطعة خضار مقرمشة مع خس وطماطم ومايونيز بالأعشاب.",
    price: 2500,
    tags: "veg",
  },

  // Pizza
  {
    slug: "margherita-pizza",
    category: "pizza",
    nameEn: "Margherita",
    nameAr: "مارغريتا",
    descriptionEn: "San Marzano tomato, fior di latte mozzarella and fresh basil.",
    descriptionAr: "صلصة طماطم سان مارزانو مع موزاريلا طازجة وريحان.",
    price: 2750,
    tags: "veg",
  },
  {
    slug: "beef-pepperoni-pizza",
    category: "pizza",
    nameEn: "Beef Pepperoni",
    nameAr: "بيبروني لحم",
    descriptionEn: "Halal beef pepperoni, mozzarella and oregano on a stone-baked base.",
    descriptionAr: "بيبروني لحم حلال مع موزاريلا وأوريغانو على عجينة مخبوزة بالحجر.",
    price: 3250,
  },
  {
    slug: "garden-pizza",
    category: "pizza",
    nameEn: "Garden Pizza",
    nameAr: "بيتزا الخضار",
    descriptionEn: "Tomato, mozzarella and fresh greens on a stone-baked base.",
    descriptionAr: "طماطم وموزاريلا وخضار طازجة على عجينة مخبوزة بالحجر.",
    price: 3000,
    tags: "veg",
  },
  {
    slug: "four-cheese-pizza",
    category: "pizza",
    nameEn: "Four Cheese",
    nameAr: "أربعة أجبان",
    descriptionEn: "Mozzarella, akkawi, parmesan and gorgonzola with a touch of honey.",
    descriptionAr: "موزاريلا وعكاوي وبارميزان وغورغونزولا مع لمسة عسل.",
    price: 3250,
    tags: "veg",
  },

  // Rice
  {
    slug: "chicken-machboos",
    category: "rice",
    nameEn: "Chicken Machboos",
    nameAr: "مجبوس دجاج",
    descriptionEn: "Kuwait's favourite — spiced basmati with a whole roasted chicken leg, daqoos and raisins.",
    descriptionAr: "الطبق الكويتي المفضل: أرز بسمتي بالبهارات مع دجاج محمر ودقوس وزبيب.",
    price: 3500,
    tags: "signature",
  },
  {
    slug: "lamb-kebab-rice",
    category: "rice",
    nameEn: "Lamb Kebab & Saffron Rice",
    nameAr: "كباب لحم مع أرز بالزعفران",
    descriptionEn: "Four charcoal-grilled lamb skewers over saffron rice with warm naan.",
    descriptionAr: "أربعة أسياخ كباب لحم مشوية على الفحم مع أرز بالزعفران وخبز نان.",
    price: 4750,
  },
  {
    slug: "chicken-curry-rice",
    category: "rice",
    nameEn: "Chicken Curry & Rice",
    nameAr: "كاري دجاج مع أرز",
    descriptionEn: "Home-style chicken curry with fluffy basmati rice.",
    descriptionAr: "كاري دجاج على الطريقة المنزلية مع أرز بسمتي.",
    price: 3250,
  },
  {
    slug: "chicken-biryani",
    category: "rice",
    nameEn: "Chicken Biryani",
    nameAr: "برياني دجاج",
    descriptionEn: "Dum-cooked chicken biryani with raita and salad.",
    descriptionAr: "برياني دجاج مطهو على الطريقة التقليدية مع رايتا وسلطة.",
    price: 3250,
    tags: "spicy",
  },

  // Drinks
  {
    slug: "iced-lemon-tea",
    category: "drinks",
    nameEn: "Iced Lemon Tea",
    nameAr: "شاي مثلج بالليمون",
    descriptionEn: "Freshly brewed black tea over ice with lemon.",
    descriptionAr: "شاي أسود طازج مع الثلج والليمون.",
    price: 750,
  },
  {
    slug: "lemon-mint",
    category: "drinks",
    nameEn: "Fresh Lemon Mint",
    nameAr: "ليمون بالنعناع",
    descriptionEn: "Blended lemon and fresh mint over crushed ice.",
    descriptionAr: "ليمون طازج مع نعناع مخفوق بالثلج المجروش.",
    price: 1000,
  },
  {
    slug: "mango-lassi",
    category: "drinks",
    nameEn: "Mango Lassi",
    nameAr: "لاسي المانجو",
    descriptionEn: "Alphonso mango blended with yoghurt and a pinch of cardamom.",
    descriptionAr: "مانجو ألفونسو مخفوق مع اللبن ورشة هيل.",
    price: 1250,
  },
  {
    slug: "fresh-orange-juice",
    category: "drinks",
    nameEn: "Fresh Orange Juice",
    nameAr: "عصير برتقال طازج",
    descriptionEn: "Squeezed to order.",
    descriptionAr: "يعصر عند الطلب.",
    price: 1250,
  },
  {
    slug: "soft-drink",
    category: "drinks",
    nameEn: "Soft Drink",
    nameAr: "مشروب غازي",
    descriptionEn: "Chilled 330 ml can — cola, diet cola, lemon-lime or orange.",
    descriptionAr: "علبة باردة ٣٣٠ مل: كولا أو دايت كولا أو ليمون أو برتقال.",
    price: 350,
  },

  // Desserts
  {
    slug: "chocolate-fudge-cake",
    category: "desserts",
    nameEn: "Chocolate Fudge Cake",
    nameAr: "كيكة الشوكولاتة",
    descriptionEn: "Rich layered chocolate cake with a glossy fudge frosting.",
    descriptionAr: "كيكة شوكولاتة غنية بطبقات مع كريمة الفدج اللامعة.",
    price: 2250,
  },
  {
    slug: "strawberry-cheesecake",
    category: "desserts",
    nameEn: "Strawberry Cheesecake",
    nameAr: "تشيز كيك الفراولة",
    descriptionEn: "Velvety cheesecake with a bright strawberry glaze.",
    descriptionAr: "تشيز كيك ناعم مع طبقة الفراولة.",
    price: 2250,
  },
  {
    slug: "blueberry-cheesecake",
    category: "desserts",
    nameEn: "Blueberry Cheesecake",
    nameAr: "تشيز كيك التوت الأزرق",
    descriptionEn: "Creamy baked cheesecake topped with blueberry compote.",
    descriptionAr: "تشيز كيك كريمي مخبوز مع صلصة التوت الأزرق.",
    price: 2250,
  },
];

/** Homepage featured items, in display order. */
export const seedPopular = [
  "saffron-butter-chicken",
  "mixed-grill-platter",
  "chicken-machboos",
  "yard-classic-burger",
  "beef-pepperoni-pizza",
  "chocolate-fudge-cake",
];

/** Customisation examples (future-ready option groups). */
export const seedOptionGroups: {
  categorySlug: string;
  nameEn: string;
  nameAr: string;
  minSelect: number;
  maxSelect: number;
  options: { nameEn: string; nameAr: string; priceDelta: number }[];
}[] = [
  {
    categorySlug: "pizza",
    nameEn: "Size",
    nameAr: "الحجم",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { nameEn: 'Medium (10")', nameAr: "وسط (١٠ إنش)", priceDelta: 0 },
      { nameEn: 'Large (13")', nameAr: "كبير (١٣ إنش)", priceDelta: 1250 },
    ],
  },
  {
    categorySlug: "burgers",
    nameEn: "Extras",
    nameAr: "إضافات",
    minSelect: 0,
    maxSelect: 3,
    options: [
      { nameEn: "Extra cheese", nameAr: "جبنة إضافية", priceDelta: 250 },
      { nameEn: "Extra patty", nameAr: "قطعة لحم إضافية", priceDelta: 1000 },
      { nameEn: "Fries on the side", nameAr: "بطاطا مقلية", priceDelta: 500 },
    ],
  },
];

export const seedAreas = [
  { nameEn: "Salmiya", nameAr: "السالمية" },
  { nameEn: "Hawalli", nameAr: "حولي" },
  { nameEn: "Jabriya", nameAr: "الجابرية" },
  { nameEn: "Surra", nameAr: "السرة" },
  { nameEn: "Kuwait City (Sharq)", nameAr: "مدينة الكويت (شرق)" },
  { nameEn: "Mishref", nameAr: "مشرف" },
  { nameEn: "Bayan", nameAr: "بيان" },
  { nameEn: "Salwa", nameAr: "سلوى" },
  { nameEn: "Rumaithiya", nameAr: "الرميثية" },
  { nameEn: "Shuwaikh", nameAr: "الشويخ", deliveryFee: 750 },
  { nameEn: "Fintas", nameAr: "الفنطاس", deliveryFee: 1000 },
  { nameEn: "Mangaf", nameAr: "المنقف", deliveryFee: 1000 },
];

export const seedOpeningHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: day === 5 ? "13:00" : "11:00",
  close: day === 4 || day === 5 ? "01:00" : "23:30",
  closed: false,
}));

/**
 * Real food photography from Unsplash (free for commercial use under the
 * Unsplash License). On first start the server copies each photo into the
 * database (see src/db/localize-images.ts), so the live site never depends on
 * Unsplash. Replace any of them with your own photos in Admin → Menu Items.
 */
export const unsplash = (id: string, w = 1200) => `https://unsplash.com/photos/${id}/download?w=${w}`;

export const seedPhotos: Record<string, string> = {
  "hummus-beiruti": "FcCLTSUyNUU",
  "garden-salad": "IGfIGP5ONV0",
  "lentil-soup": "fxJTl_gDh28",
  "mezze-platter": "DTnKo8b90TU",
  "crispy-samosas": "QFQx9s0sVsc",
  "mixed-grill-platter": "o__sIR_14dA",
  "shish-tawook": "RfpGZ2x6COA",
  "saffron-butter-chicken": "8zLfugmjMLc",
  "grilled-hammour": "aGWRUSFzyBU",
  "yard-classic-burger": "vdkyWisomns",
  "saffron-chicken-burger": "pLKgCsBOiw4",
  "double-cheese-burger": "t9Y3a9O6XNY",
  "garden-veggie-burger": "nwLe7057AdY",
  "margherita-pizza": "L4W1uX1xwlQ",
  "beef-pepperoni-pizza": "XtIHk2mLw0U",
  "garden-pizza": "OW5sCIT3H9o",
  "four-cheese-pizza": "D3Mag4BKqns",
  "chicken-machboos": "zW5jxNixbLI",
  "lamb-kebab-rice": "0hnVMVaDaNM",
  "chicken-curry-rice": "tsQhEvzU6MQ",
  "chicken-biryani": "OterGMpkdsM",
  "iced-lemon-tea": "gHYOL97H5NM",
  "lemon-mint": "cLmCH3aygHk",
  "mango-lassi": "KlVIYmGVRQ8",
  "fresh-orange-juice": "kkrXVKK-jhg",
  "soft-drink": "5-1bnIva99Y",
  "chocolate-fudge-cake": "B6gIcZsod2Y",
  "blueberry-cheesecake": "lKF0Urvp4RY",
  "strawberry-cheesecake": "_BBTqanOrBI",
};

export const heroPhoto = "NLhqfaZEYmo";
export const aboutPhoto = "1VTEK-sA8w8";
