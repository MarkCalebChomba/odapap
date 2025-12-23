const categoryHierarchy = { 
    fashion: {
        label: "Fashion & Apparel",
        subcategories: {
            "mens-wear": {
                label: "Men's Wear",
                types: ["Custom", "T-Shirts", "Shirts", "Trousers", "Jeans", "Shorts", "Jackets", "Coats", "Suits", "Blazers", "Hoodies", "Sweatshirts", "Sweaters", "Polo Shirts", "Tank Tops", "Underwear", "Socks", "Sportswear", "Swimwear", "Sleepwear", "Ethnic Wear"]
            },
            "womens-wear": {
                label: "Women's Wear",
                types: ["Custom", "Dresses", "Tops", "Blouses", "Shirts", "T-Shirts", "Skirts", "Pants", "Jeans", "Leggings", "Shorts", "Jumpsuits", "Rompers", "Jackets", "Coats", "Cardigans", "Sweaters", "Hoodies", "Lingerie", "Bras", "Panties", "Sportswear", "Activewear", "Swimwear", "Beachwear", "Sleepwear", "Nightgowns", "Ethnic Wear", "Sarees", "Salwar Kameez", "Lehengas", "Kurtis"]
            },
            "kids-wear": {
                label: "Kids Wear",
                types: ["Custom", "Boys T-Shirts", "Boys Shirts", "Boys Trousers", "Boys Shorts", "Boys Jeans", "Girls Dresses", "Girls Tops", "Girls Skirts", "Girls Pants", "Girls Leggings", "Baby Onesies", "Baby Rompers", "Baby Bodysuits", "Kids Jackets", "Kids Hoodies", "Kids Sweaters", "Kids Sleepwear", "Kids Swimwear", "Kids Ethnic Wear", "School Uniforms"]
            },
            "footwear": {
                label: "Footwear",
                types: ["Custom", "Men's Sneakers", "Men's Formal Shoes", "Men's Boots", "Men's Sandals", "Men's Slippers", "Men's Sports Shoes", "Women's Heels", "Women's Flats", "Women's Sneakers", "Women's Boots", "Women's Sandals", "Women's Slippers", "Women's Sports Shoes", "Kids Shoes", "Kids Sneakers", "Kids Sandals"]
            },
            "bags-luggage": {
                label: "Bags & Luggage",
                types: ["Custom", "Backpacks", "Handbags", "Shoulder Bags", "Tote Bags", "Clutches", "Crossbody Bags", "Messenger Bags", "Laptop Bags", "Travel Bags", "Duffel Bags", "Suitcases", "Trolley Bags", "Wallets", "Purses"]
            },
            "accessories": {
                label: "Fashion Accessories",
                types: ["Custom", "Watches", "Sunglasses", "Belts", "Ties", "Bow Ties", "Scarves", "Hats", "Caps", "Jewelry", "Necklaces", "Bracelets", "Earrings", "Rings", "Hair Accessories", "Gloves", "Umbrellas"]
            },
            "sports-wear": {
                label: "Sports & Activewear",
                types: ["Custom", "Running Shoes", "Training Shoes", "Yoga Pants", "Sports Bras", "Gym Shorts", "Track Pants", "Athletic Tops", "Compression Wear", "Sports Jackets", "Cycling Gear", "Swimming Gear"]
            }
        }
    },
    electronics: {
        label: "Electronics",
        subcategories: {
            "mobile-accessories": {
                label: "Mobile Accessories",
                types: ["Custom", "Phone Cases", "Screen Protectors", "Tempered Glass", "Power Banks", "Phone Chargers", "Wireless Chargers", "Fast Chargers", "USB Cables", "Lightning Cables", "Type-C Cables", "Car Chargers", "Phone Holders", "Pop Sockets", "Ring Holders", "Selfie Sticks", "Phone Lenses", "Memory Cards", "OTG Adapters"]
            },
            "audio": {
                label: "Audio Devices",
                types: ["Custom", "Wireless Earbuds", "Wired Earphones", "Over-Ear Headphones", "On-Ear Headphones", "In-Ear Monitors", "Gaming Headsets", "Bluetooth Speakers", "Portable Speakers", "Home Theater Systems", "Soundbars", "Subwoofers", "Studio Monitors", "Microphones", "Podcasting Mics", "Karaoke Systems", "MP3 Players", "Audio Cables", "Headphone Amplifiers"]
            },
            "computers": {
                label: "Computer Accessories",
                types: ["Custom", "Keyboards", "Mechanical Keyboards", "Wireless Keyboards", "Gaming Keyboards", "Mice", "Wireless Mice", "Gaming Mice", "Mousepads", "USB Drives", "External Hard Drives", "SSDs", "Internal Hard Drives", "Laptop Bags", "Laptop Stands", "Monitor Stands", "Webcams", "USB Hubs", "Card Readers", "Laptop Chargers", "Cooling Pads", "Cable Organizers", "Screen Cleaners"]
            },
            "cameras": {
                label: "Cameras & Photography",
                types: ["Custom", "DSLR Cameras", "Mirrorless Cameras", "Point-and-Shoot Cameras", "Action Cameras", "Instant Cameras", "Camera Lenses", "Tripods", "Monopods", "Camera Bags", "Memory Cards", "Camera Batteries", "Camera Chargers", "Flash Units", "Light Stands", "Reflectors", "Backdrops", "Gimbals", "Camera Straps"]
            },
            "gaming": {
                label: "Gaming Accessories",
                types: ["Custom", "Gaming Consoles", "Game Controllers", "Gaming Chairs", "Gaming Desks", "VR Headsets", "Racing Wheels", "Flight Sticks", "Gaming Monitors", "Capture Cards", "Gaming Keyboards", "Gaming Mice", "Gaming Headsets", "Controller Chargers", "Console Storage"]
            },
            "wearables": {
                label: "Wearable Technology",
                types: ["Custom", "Smartwatches", "Fitness Trackers", "Smart Bands", "Smart Glasses", "Smart Rings", "VR Headsets", "AR Glasses", "Watch Straps", "Charging Cables"]
            },
            "tv-video": {
                label: "TV & Video",
                types: ["Custom", "LED TVs", "Smart TVs", "4K TVs", "8K TVs", "OLED TVs", "QLED TVs", "Projectors", "Streaming Devices", "TV Mounts", "TV Stands", "HDMI Cables", "Remote Controls", "TV Antennas", "Set-Top Boxes"]
            },
            "networking": {
                label: "Networking & WiFi",
                types: ["Custom", "WiFi Routers", "Mesh Systems", "Range Extenders", "Modems", "Network Switches", "Ethernet Cables", "Powerline Adapters", "WiFi Adapters", "Network Cards"]
            },
            "smart-home": {
                label: "Smart Home Devices",
                types: ["Custom", "Smart Speakers", "Smart Displays", "Smart Bulbs", "Smart Plugs", "Smart Switches", "Smart Thermostats", "Smart Locks", "Video Doorbells", "Security Cameras", "Motion Sensors", "Smart Hubs", "Smart Curtains", "Smart Detectors"]
            },
            "power": {
                label: "Power & Batteries",
                types: ["Custom", "Power Banks", "Rechargeable Batteries", "Battery Chargers", "UPS Systems", "Power Strips", "Surge Protectors", "Extension Cords", "Solar Chargers", "Inverters", "Voltage Stabilizers"]
            }
        }
    },
    phones: {
        label: "Mobile Phones & Tablets",
        subcategories: {
            "smartphones": {
                label: "Smartphones",
                types: ["Custom", "Android Phones", "iPhones", "5G Phones", "Gaming Phones", "Camera Phones", "Budget Phones", "Flagship Phones", "Foldable Phones", "Feature Phones", "Rugged Phones"]
            },
            "tablets": {
                label: "Tablets",
                types: ["Custom", "Android Tablets", "iPads", "Windows Tablets", "Drawing Tablets", "Kids Tablets", "Gaming Tablets", "E-Readers"]
            },
            "tablet-accessories": {
                label: "Tablet Accessories",
                types: ["Custom", "Tablet Cases", "Tablet Keyboards", "Stylus Pens", "Screen Protectors", "Tablet Stands", "Tablet Chargers"]
            }
        }
    },
    beauty: {
        label: "Beauty & Personal Care",
        subcategories: {
            "skincare": {
                label: "Skincare",
                types: ["Custom", "Face Cleansers", "Face Wash", "Exfoliators", "Toners", "Face Serums", "Face Creams", "Moisturizers", "Night Creams", "Eye Creams", "Face Masks", "Sheet Masks", "Sunscreen", "SPF Lotions", "Anti-Aging Products", "Acne Treatment", "Face Oils", "Facial Mists", "Makeup Removers", "Lip Balms"]
            },
            "makeup": {
                label: "Makeup",
                types: ["Custom", "Foundation", "BB Cream", "CC Cream", "Concealer", "Powder", "Blush", "Bronzer", "Highlighter", "Contour", "Lipstick", "Lip Gloss", "Lip Liner", "Eyeshadow Palettes", "Eyeliner", "Mascara", "Eyebrow Pencils", "Eyebrow Gel", "Makeup Brushes", "Makeup Sponges", "Setting Spray", "Primer", "Nail Polish", "Nail Care"]
            },
            "haircare": {
                label: "Hair Care",
                types: ["Custom", "Shampoo", "Conditioner", "Hair Masks", "Hair Oil", "Hair Serum", "Hair Spray", "Hair Gel", "Hair Wax", "Hair Mousse", "Leave-In Conditioner", "Dry Shampoo", "Hair Color", "Hair Dye", "Hair Bleach", "Hair Straighteners", "Hair Curlers", "Hair Dryers", "Hair Brushes", "Combs", "Hair Clips", "Hair Bands"]
            },
            "fragrance": {
                label: "Fragrances",
                types: ["Custom", "Men's Perfume", "Women's Perfume", "Unisex Perfume", "Body Sprays", "Deodorants", "Cologne", "Attars", "Essential Oils", "Fragrance Sets"]
            },
            "bath-body": {
                label: "Bath & Body",
                types: ["Custom", "Body Wash", "Shower Gel", "Bar Soap", "Body Lotion", "Body Butter", "Body Scrub", "Body Oil", "Hand Wash", "Hand Cream", "Foot Cream", "Bath Salts", "Bath Bombs"]
            },
            "mens-grooming": {
                label: "Men's Grooming",
                types: ["Custom", "Shaving Cream", "Aftershave", "Razors", "Electric Shavers", "Trimmers", "Beard Oil", "Beard Balm", "Beard Wash", "Face Wash for Men", "Moisturizer for Men"]
            },
            "personal-care": {
                label: "Personal Care",
                types: ["Custom", "Toothpaste", "Toothbrushes", "Electric Toothbrushes", "Mouthwash", "Dental Floss", "Feminine Hygiene Products", "Sanitary Pads", "Tampons", "Menstrual Cups", "Intimate Wash", "Cotton Pads", "Cotton Swabs", "Tissue Papers", "Wet Wipes"]
            },
            "beauty-tools": {
                label: "Beauty Tools & Devices",
                types: ["Custom", "Makeup Brushes", "Beauty Blenders", "Eyelash Curlers", "Tweezers", "Nail Clippers", "Manicure Sets", "Face Rollers", "Gua Sha", "LED Face Masks", "Facial Steamers", "Hair Removal Devices", "Epilators"]
            }
        }
    },
    health: {
        label: "Health & Wellness",
        subcategories: {
            "supplements": {
                label: "Vitamins & Supplements",
                types: ["Custom", "Multivitamins", "Vitamin C", "Vitamin D", "Vitamin B Complex", "Calcium Supplements", "Iron Supplements", "Omega-3", "Fish Oil", "Probiotics", "Protein Powder", "Weight Gainers", "Pre-Workout", "Post-Workout", "BCAAs", "Creatine", "Collagen Supplements", "Herbal Supplements"]
            },
            "medical-supplies": {
                label: "Medical Supplies",
                types: ["Custom", "First Aid Kits", "Bandages", "Gauze", "Medical Tape", "Thermometers", "Blood Pressure Monitors", "Glucose Meters", "Pulse Oximeters", "Nebulizers", "Heating Pads", "Ice Packs", "Compression Socks", "Braces", "Supports"]
            },
            "fitness": {
                label: "Fitness Equipment",
                types: ["Custom", "Dumbbells", "Kettlebells", "Resistance Bands", "Yoga Mats", "Exercise Balls", "Jump Ropes", "Pull-Up Bars", "Push-Up Bars", "Ab Rollers", "Foam Rollers", "Treadmills", "Exercise Bikes", "Ellipticals", "Weight Benches", "Home Gyms"]
            },
            "sexual-wellness": {
                label: "Sexual Wellness",
                types: ["Custom", "Condoms", "Lubricants", "Pregnancy Tests", "Ovulation Tests", "Sexual Health Products"]
            }
        }
    },
    kitchenware: {
        label: "Kitchenware & Home",
        subcategories: {
            "cookware": {
                label: "Cookware",
                types: ["Custom", "Pots", "Pans", "Frying Pans", "Non-Stick Pans", "Pressure Cookers", "Slow Cookers", "Dutch Ovens", "Woks", "Saucepans", "Stockpots", "Roasting Pans", "Baking Trays", "Cake Pans", "Muffin Tins", "Casserole Dishes"]
            },
            "appliances": {
                label: "Kitchen Appliances",
                types: ["Custom", "Blenders", "Food Processors", "Mixers", "Hand Mixers", "Stand Mixers", "Juicers", "Coffee Makers", "Espresso Machines", "Tea Kettles", "Electric Kettles", "Toasters", "Toaster Ovens", "Microwaves", "Air Fryers", "Deep Fryers", "Rice Cookers", "Slow Cookers", "Pressure Cookers", "Grills", "Sandwich Makers", "Waffle Makers", "Ice Cream Makers", "Food Steamers", "Dishwashers"]
            },
            "cutlery-utensils": {
                label: "Cutlery & Utensils",
                types: ["Custom", "Knife Sets", "Chef Knives", "Cutting Boards", "Spatulas", "Ladles", "Whisks", "Tongs", "Peelers", "Graters", "Can Openers", "Scissors", "Measuring Cups", "Measuring Spoons", "Mixing Bowls", "Colanders", "Strainers"]
            },
            "dinnerware": {
                label: "Dinnerware & Serveware",
                types: ["Custom", "Dinner Plates", "Side Plates", "Bowls", "Serving Bowls", "Platters", "Cups", "Mugs", "Glasses", "Wine Glasses", "Coffee Mugs", "Tea Sets", "Dinner Sets", "Cutlery Sets", "Spoons", "Forks", "Knives"]
            },
            "storage": {
                label: "Storage & Organization",
                types: ["Custom", "Food Containers", "Lunch Boxes", "Water Bottles", "Thermoses", "Storage Jars", "Spice Racks", "Bread Boxes", "Canisters", "Refrigerator Organizers", "Drawer Organizers", "Vacuum Bags"]
            },
            "bakeware": {
                label: "Bakeware & Baking Tools",
                types: ["Custom", "Baking Sheets", "Cake Pans", "Muffin Tins", "Loaf Pans", "Pie Dishes", "Cookie Cutters", "Rolling Pins", "Pastry Brushes", "Piping Bags", "Cooling Racks", "Baking Mats"]
            }
        }
    },
    furniture: {
        label: "Furniture & Home Decor",
        subcategories: {
            "living-room": {
                label: "Living Room Furniture",
                types: ["Custom", "Sofas", "Sectionals", "Loveseats", "Recliners", "Armchairs", "Coffee Tables", "Side Tables", "TV Stands", "Entertainment Centers", "Bookcases", "Display Cabinets", "Console Tables"]
            },
            "bedroom": {
                label: "Bedroom Furniture",
                types: ["Custom", "Beds", "Bed Frames", "Headboards", "Mattresses", "Nightstands", "Dressers", "Wardrobes", "Closets", "Vanity Tables", "Bed Sheets", "Comforters", "Duvets", "Pillows", "Cushions", "Blankets"]
            },
            "dining": {
                label: "Dining Furniture",
                types: ["Custom", "Dining Tables", "Dining Chairs", "Bar Stools", "Kitchen Islands", "Buffets", "Sideboards", "China Cabinets", "Serving Carts"]
            },
            "office": {
                label: "Office Furniture",
                types: ["Custom", "Office Desks", "Computer Desks", "Office Chairs", "Ergonomic Chairs", "Filing Cabinets", "Bookcases", "Desk Organizers", "Monitor Stands", "Desk Lamps"]
            },
            "outdoor": {
                label: "Outdoor Furniture",
                types: ["Custom", "Patio Sets", "Garden Chairs", "Outdoor Tables", "Sun Loungers", "Hammocks", "Umbrellas", "Gazebos", "Garden Benches"]
            },
            "storage-organization": {
                label: "Storage & Organization",
                types: ["Custom", "Shelving Units", "Storage Cabinets", "Shoe Racks", "Coat Racks", "Storage Bins", "Baskets", "Hooks", "Wall Organizers"]
            },
            "home-decor": {
                label: "Home Decor",
                types: ["Custom", "Wall Art", "Paintings", "Frames", "Mirrors", "Clocks", "Vases", "Candles", "Candle Holders", "Decorative Pillows", "Throws", "Rugs", "Carpets", "Curtains", "Blinds", "Wall Stickers", "Plants", "Artificial Plants", "Lamps", "Floor Lamps", "Table Lamps", "Ceiling Lights", "Chandeliers"]
            },
            "kids-furniture": {
                label: "Kids Furniture",
                types: ["Custom", "Kids Beds", "Bunk Beds", "Cribs", "Toddler Beds", "Kids Desks", "Kids Chairs", "Toy Storage", "Kids Bookshelves"]
            }
        }
    },
    appliances: {
        label: "Home Appliances",
        subcategories: {
            "large-appliances": {
                label: "Large Appliances",
                types: ["Custom", "Refrigerators", "Freezers", "Washing Machines", "Dryers", "Washer-Dryer Combos", "Dishwashers", "Ovens", "Ranges", "Cooktops", "Hoods", "Air Conditioners", "Water Heaters", "Water Dispensers"]
            },
            "small-appliances": {
                label: "Small Appliances",
                types: ["Custom", "Vacuum Cleaners", "Robot Vacuums", "Steam Mops", "Irons", "Steam Irons", "Garment Steamers", "Fans", "Heaters", "Air Purifiers", "Humidifiers", "Dehumidifiers", "Sewing Machines"]
            },
            "cleaning": {
                label: "Cleaning Appliances",
                types: ["Custom", "Vacuum Cleaners", "Wet & Dry Vacuums", "Carpet Cleaners", "Steam Cleaners", "High Pressure Washers", "Window Cleaners"]
            }
        }
    },
    baby: {
        label: "Baby & Kids",
        subcategories: {
            "baby-gear": {
                label: "Baby Gear",
                types: ["Custom", "Strollers", "Car Seats", "Baby Carriers", "Baby Slings", "Playpens", "Baby Bouncers", "Baby Swings", "Baby Monitors", "Baby Gates", "High Chairs", "Booster Seats"]
            },
            "baby-care": {
                label: "Baby Care",
                types: ["Custom", "Diapers", "Baby Wipes", "Diaper Bags", "Baby Bottles", "Bottle Warmers", "Sterilizers", "Breast Pumps", "Nursing Pillows", "Baby Bath Tubs", "Baby Shampoo", "Baby Lotion", "Baby Oil", "Baby Powder", "Pacifiers", "Teethers"]
            },
            "baby-clothing": {
                label: "Baby Clothing & Shoes",
                types: ["Custom", "Baby Bodysuits", "Baby Rompers", "Baby Sleepsuits", "Baby Dresses", "Baby Tops", "Baby Bottoms", "Baby Socks", "Baby Shoes", "Baby Hats", "Baby Mittens", "Baby Bibs"]
            },
            "nursery": {
                label: "Nursery",
                types: ["Custom", "Cribs", "Crib Mattresses", "Moses Baskets", "Changing Tables", "Nursing Chairs", "Baby Bedding", "Baby Blankets", "Crib Sheets", "Baby Lamps", "Mobiles"]
            },
            "toys": {
                label: "Toys & Games",
                types: ["Custom", "Soft Toys", "Dolls", "Action Figures", "Building Blocks", "Puzzles", "Board Games", "Educational Toys", "Musical Toys", "Ride-On Toys", "Outdoor Toys", "Bath Toys", "Electronic Toys", "Remote Control Toys", "Arts & Crafts", "Play Dough"]
            },
            "kids-accessories": {
                label: "Kids Accessories",
                types: ["Custom", "School Bags", "Lunch Boxes", "Water Bottles", "Kids Watches", "Kids Sunglasses", "Kids Jewelry", "Hair Accessories"]
            }
        }
    },
    sports: {
        label: "Sports & Outdoors",
        subcategories: {
            "sports-equipment": {
                label: "Sports Equipment",
                types: ["Custom", "Footballs", "Basketballs", "Volleyballs", "Tennis Rackets", "Badminton Rackets", "Table Tennis", "Cricket Bats", "Cricket Balls", "Golf Clubs", "Golf Balls", "Boxing Gloves", "Punching Bags", "Skipping Ropes", "Sports Nets"]
            },
            "outdoor-recreation": {
                label: "Outdoor Recreation",
                types: ["Custom", "Tents", "Sleeping Bags", "Camping Chairs", "Camping Tables", "Coolers", "Backpacks", "Hiking Boots", "Trekking Poles", "Binoculars", "Compasses", "Fishing Rods", "Fishing Reels", "Fishing Tackle"]
            },
            "cycling": {
                label: "Cycling",
                types: ["Custom", "Bicycles", "Mountain Bikes", "Road Bikes", "Electric Bikes", "Kids Bikes", "Bike Helmets", "Bike Lights", "Bike Locks", "Bike Pumps", "Bike Accessories", "Cycling Gloves", "Bike Seats"]
            },
            "water-sports": {
                label: "Water Sports",
                types: ["Custom", "Swimwear", "Swim Goggles", "Swim Caps", "Life Jackets", "Snorkeling Gear", "Diving Gear", "Surfboards", "Paddleboards", "Kayaks", "Water Bottles"]
            },
            "fitness-yoga": {
                label: "Fitness & Yoga",
                types: ["Custom", "Yoga Mats", "Yoga Blocks", "Yoga Straps", "Resistance Bands", "Exercise Balls", "Dumbbells", "Kettlebells", "Jump Ropes", "Fitness Trackers", "Sports Watches"]
            }
        }
    },
    automotive: {
        label: "Automotive",
        subcategories: {
            "car-accessories": {
                label: "Car Accessories",
                types: ["Custom", "Car Seat Covers", "Steering Wheel Covers", "Car Mats", "Car Organizers", "Car Phone Holders", "Car Chargers", "Car Air Fresheners", "Windshield Wipers", "Car Covers", "Sunshades"]
            },
            "car-electronics": {
                label: "Car Electronics",
                types: ["Custom", "Car Stereos", "Car Speakers", "GPS Navigation", "Dash Cams", "Rear View Cameras", "Car Alarms", "Parking Sensors", "Bluetooth Devices"]
            },
            "car-care": {
                label: "Car Care & Maintenance",
                types: ["Custom", "Car Wash Soap", "Car Wax", "Car Polish", "Tire Cleaners", "Glass Cleaners", "Car Vacuums", "Pressure Washers", "Microfiber Cloths", "Car Tools", "Jump Starters", "Tire Inflators"]
            },
            "motorcycle": {
                label: "Motorcycle Accessories",
                types: ["Custom", "Motorcycle Helmets", "Motorcycle Gloves", "Motorcycle Jackets", "Riding Boots", "Motorcycle Covers", "Motorcycle Locks", "Phone Mounts", "Saddle Bags"]
            }
        }
    },
    books: {
        label: "Books & Stationery",
        subcategories: {
            "books": {
                label: "Books",
                types: ["Custom", "Fiction", "Non-Fiction", "Mystery", "Thriller", "Romance", "Fantasy", "Science Fiction", "Biography", "Self-Help", "Business", "Cooking", "Health", "Travel", "Children's Books", "Comics", "Manga", "Magazines"]
            },
            "stationery": {
                label: "Stationery",
                types: ["Custom", "Notebooks", "Journals", "Diaries", "Planners", "Pens", "Pencils", "Markers", "Highlighters", "Erasers", "Sharpeners", "Rulers", "Staplers", "Paper Clips", "Sticky Notes", "Folders", "Binders", "File Organizers", "Desk Organizers", "Calculator"]
            },
            "art-supplies": {
                label: "Art Supplies",
                types: ["Custom", "Sketchbooks", "Drawing Pencils", "Colored Pencils", "Watercolors", "Acrylic Paints", "Oil Paints", "Paint Brushes", "Canvas", "Easels", "Markers", "Crayons", "Pastels", "Clay"]
            }
        }
    },
    groceries: {
        label: "Groceries & Food",
        subcategories: {
            "beverages": {
                label: "Beverages",
                types: ["Custom", "Water", "Soft Drinks", "Juice", "Energy Drinks", "Tea", "Coffee", "Milk", "Flavored Milk", "Plant-Based Milk", "Sports Drinks"]
            },
            "snacks": {
                label: "Snacks",
                types: ["Custom", "Chips", "Crisps", "Biscuits", "Cookies", "Crackers", "Nuts", "Dried Fruits", "Chocolate", "Candy", "Gum", "Popcorn", "Pretzels", "Protein Bars", "Granola Bars"]
            },
            "pantry": {
                label: "Pantry Staples",
                types: ["Custom", "Rice", "Pasta", "Noodles", "Flour", "Sugar", "Salt", "Oil", "Cooking Oil", "Spices", "Herbs", "Sauces", "Ketchup", "Mayonnaise", "Vinegar", "Honey", "Jam", "Peanut Butter", "Canned Foods", "Cereals", "Oats"]
            },
            "fresh-produce": {
                label: "Fresh Produce",
                types: ["Custom", "Fruits", "Vegetables", "Meat", "Poultry", "Seafood", "Eggs", "Dairy Products", "Cheese", "Yogurt", "Butter", "Bread", "Bakery Items"]
            },
            "frozen-foods": {
                label: "Frozen Foods",
                types: ["Custom", "Frozen Vegetables", "Frozen Fruits", "Frozen Meat", "Frozen Seafood", "Ice Cream", "Frozen Pizza", "Frozen Meals", "Frozen Snacks"]
            }
        }
    },
    pets: {
        label: "Pet Supplies",
        subcategories: {
            "dog-supplies": {
                label: "Dog Supplies",
                types: ["Custom", "Dog Food", "Dog Treats", "Dog Toys", "Dog Beds", "Dog Collars", "Dog Leashes", "Dog Bowls", "Dog Grooming", "Dog Shampoo", "Dog Clothes", "Dog Carriers", "Dog Training"]
            },
            "cat-supplies": {
                label: "Cat Supplies",
                types: ["Custom", "Cat Food", "Cat Treats", "Cat Toys", "Cat Beds", "Cat Litter", "Litter Boxes", "Cat Scratchers", "Cat Collars", "Cat Bowls", "Cat Grooming", "Cat Carriers"]
            },
            "pet-accessories": {
                label: "Pet Accessories",
                types: ["Custom", "Pet Cages", "Aquariums", "Fish Tanks", "Bird Cages", "Pet Feeders", "Pet Waterers", "Pet Cleaning", "Pet Health"]
            }
        }
    },
    jewelry: {
        label: "Jewelry & Watches",
        subcategories: { "jewelry": {
            label: "Jewelry",
            types: ["Custom", "Necklaces", "Chains", "Pendants", "Bracelets", "Bangles", "Earrings", "Rings", "Engagement Rings", "Wedding Rings", "Anklets", "Brooches", "Jewelry Sets", "Gold Jewelry", "Silver Jewelry", "Diamond Jewelry", "Fashion Jewelry"]
        },
        "watches": {
            label: "Watches",
            types: ["Custom", "Men's Watches", "Women's Watches", "Smartwatches", "Luxury Watches", "Sports Watches", "Fashion Watches", "Analog Watches", "Digital Watches", "Watch Bands", "Watch Accessories"]
        }
    }
},
office: {
    label: "Office Supplies",
    subcategories: {
        "office-furniture": {
            label: "Office Furniture",
            types: ["Custom", "Office Desks", "Office Chairs", "Conference Tables", "Reception Desks", "Filing Cabinets", "Storage Cabinets", "Bookcases", "Whiteboards", "Notice Boards"]
        },
        "office-electronics": {
            label: "Office Electronics",
            types: ["Custom", "Printers", "Scanners", "Copiers", "Shredders", "Laminators", "Projectors", "Calculators", "Label Makers", "Time Clocks"]
        },
        "office-supplies": {
            label: "Office Supplies",
            types: ["Custom", "Paper", "Envelopes", "Folders", "Binders", "Staplers", "Hole Punches", "Paper Clips", "Rubber Bands", "Tape", "Scissors", "Desk Organizers", "File Organizers", "Labels", "Name Tags"]
        }
    }
},
garden: {
    label: "Garden & Outdoor",
    subcategories: {
        "gardening": {
            label: "Gardening",
            types: ["Custom", "Seeds", "Plants", "Flowers", "Pots", "Planters", "Garden Tools", "Shovels", "Rakes", "Hoes", "Pruners", "Garden Gloves", "Watering Cans", "Hoses", "Sprinklers", "Fertilizers", "Soil", "Compost"]
        },
        "outdoor-decor": {
            label: "Outdoor Decor",
            types: ["Custom", "Garden Lights", "Solar Lights", "Garden Statues", "Garden Ornaments", "Bird Feeders", "Bird Houses", "Wind Chimes", "Garden Fountains"]
        },
        "bbq-outdoor": {
            label: "BBQ & Outdoor Cooking",
            types: ["Custom", "BBQ Grills", "Charcoal Grills", "Gas Grills", "Electric Grills", "BBQ Tools", "Grilling Accessories", "Outdoor Pizza Ovens", "Fire Pits"]
        }
    }
},
industrial: {
    label: "Industrial & Scientific",
    subcategories: {
        "tools": {
            label: "Tools & Hardware",
            types: ["Custom", "Power Tools", "Drills", "Saws", "Sanders", "Grinders", "Hand Tools", "Screwdrivers", "Hammers", "Wrenches", "Pliers", "Measuring Tools", "Levels", "Tool Boxes", "Tool Bags", "Nails", "Screws", "Bolts", "Nuts"]
        },
        "safety": {
            label: "Safety Equipment",
            types: ["Custom", "Safety Helmets", "Safety Goggles", "Safety Gloves", "Ear Protection", "Respirators", "Safety Vests", "Hard Hats", "Safety Shoes", "Fire Extinguishers", "First Aid Kits"]
        },
        "electrical": {
            label: "Electrical Supplies",
            types: ["Custom", "Wires", "Cables", "Switches", "Sockets", "Circuit Breakers", "Extension Cords", "Light Bulbs", "LED Bulbs", "Batteries", "Flashlights"]
        }
    }
}
};
// Brands by category
const brandsByCategory = {
fashion: ["Custom/Other", "Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "Converse", "Vans", "Zara", "H&M", "Forever 21", "Gap", "Old Navy", "Uniqlo", "Levi's", "Wrangler", "Lee", "Diesel", "Calvin Klein", "Tommy Hilfiger", "Ralph Lauren", "Lacoste", "Hugo Boss", "Armani", "Gucci", "Prada", "Versace", "Burberry", "Louis Vuitton", "Chanel", "Dior", "Fendi", "Balenciaga", "Givenchy", "Valentino", "Dolce & Gabbana", "Mango", "Massimo Dutti", "Pull & Bear", "Bershka", "Stradivarius", "Reserved", "Primark", "Topshop", "River Island", "Next", "Marks & Spencer", "John Lewis", "Debenhams", "Generic"],
electronics: ["Custom/Other", "Samsung", "Apple", "Sony", "LG", "Panasonic", "Philips", "Bosch", "Siemens", "Whirlpool", "Hitachi", "Toshiba", "Sharp", "JBL", "Bose", "Beats", "Sennheiser", "Audio-Technica", "Anker", "Belkin", "Logitech", "HP", "Dell", "Lenovo", "Asus", "Acer", "Microsoft", "Canon", "Nikon", "Fujifilm", "GoPro", "DJI", "Sandisk", "Western Digital", "Seagate", "Kingston", "Corsair", "Razer", "SteelSeries", "HyperX", "Netgear", "TP-Link", "D-Link", "Xiaomi", "Huawei", "OnePlus", "Realme", "Oppo", "Vivo", "Generic"],

phones: ["Custom/Other", "Apple", "Samsung", "Huawei", "Xiaomi", "Oppo", "Vivo", "OnePlus", "Realme", "Google", "Motorola", "Nokia", "Sony", "LG", "HTC", "Asus", "Lenovo", "ZTE", "Tecno", "Infinix", "Itel", "Blackberry", "Alcatel", "Meizu", "Honor", "Nothing", "Generic"],

beauty: ["Custom/Other", "L'Oreal", "Maybelline", "Revlon", "Covergirl", "MAC", "Estee Lauder", "Clinique", "Lancome", "Dior", "Chanel", "YSL", "NARS", "Urban Decay", "Benefit", "Too Faced", "Anastasia Beverly Hills", "Fenty Beauty", "Huda Beauty", "NYX", "e.l.f", "Wet n Wild", "Milani", "Neutrogena", "Cetaphil", "Cerave", "La Roche-Posay", "Vichy", "Bioderma", "The Ordinary", "Paula's Choice", "Drunk Elephant", "Glossier", "Tatcha", "SK-II", "Shiseido", "Olay", "Nivea", "Dove", "Vaseline", "Garnier", "Pantene", "Head & Shoulders", "Herbal Essences", "Tresemme", "Dove", "Sunsilk", "Schwarzkopf", "L'Oreal Paris", "Kerastase", "Redken", "Paul Mitchell", "Moroccanoil", "Generic"],

health: ["Custom/Other", "Centrum", "Nature Made", "Nature's Bounty", "GNC", "Optimum Nutrition", "Muscletech", "BSN", "Cellucor", "Dymatize", "Myprotein", "Universal Nutrition", "MusclePh arm", "Quest Nutrition", "Garden of Life", "NOW Foods", "Solgar", "Vitabiotics", "Blackmores", "Swisse", "Himalaya", "Dabur", "Patanjali", "Baidyanath", "Hamdard", "Abbott", "Johnson & Johnson", "Pfizer", "Bayer", "GSK", "Reckitt", "Generic"],

kitchenware: ["Custom/Other", "Tefal", "Prestige", "Hawkins", "Pigeon", "Wonderchef", "Meyer", "Calphalon", "Cuisinart", "All-Clad", "Le Creuset", "Lodge", "Staub", "Circulon", "KitchenAid", "Cuisinart", "Breville", "De'Longhi", "Philips", "Oster", "Hamilton Beach", "Black+Decker", "Kenwood", "Bosch", "Braun", "Ninja", "NutriBullet", "Vitamix", "Nespresso", "Keurig", "Mr. Coffee", "Pyrex", "Corningware", "Tupperware", "Rubbermaid", "OXO", "Joseph Joseph", "Lakeland", "Generic"],

furniture: ["Custom/Other", "IKEA", "Ashley Furniture", "Wayfair", "West Elm", "Pottery Barn", "Crate & Barrel", "Restoration Hardware", "CB2", "Room & Board", "Ethan Allen", "La-Z-Boy", "Haverty's", "Rooms To Go", "Bob's Discount Furniture", "Value City Furniture", "American Signature", "Jerome's", "Living Spaces", "Havertys", "Generic"],

appliances: ["Custom/Other", "Whirlpool", "LG", "Samsung", "Bosch", "Siemens", "Electrolux", "Miele", "KitchenAid", "GE", "Frigidaire", "Maytag", "Kenmore", "Hotpoint", "Haier", "Midea", "Hisense", "TCL", "Godrej", "IFB", "Voltas", "Blue Star", "Lloyd", "Carrier", "Daikin", "Mitsubishi", "Hitachi", "Panasonic", "Sharp", "Dyson", "Hoover", "Bissell", "Shark", "Eureka", "Rowenta", "Tefal", "Philips", "Morphy Richards", "Kenwood", "Generic"],

baby: ["Custom/Other", "Pampers", "Huggies", "Johnson & Johnson", "Johnsons Baby", "Cetaphil Baby", "Aveeno Baby", "Mustela", "Chicco", "Graco", "Britax", "Evenflo", "Safety 1st", "Fisher-Price", "Little Tikes", "Melissa & Doug", "VTech", "LeapFrog", "Baby Einstein", "Skip Hop", "Munchkin", "Philips Avent", "Tommee Tippee", "Dr. Brown's", "Medela", "Spectra", "Lansinoh", "Boppy", "Ergobaby", "BabyBjorn", "Infantino", "Bumbo", "Maxi-Cosi", "Nuna", "UPPAbaby", "Bugaboo", "Stokke", "Generic"],

sports: ["Custom/Other", "Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "Asics", "Mizuno", "Saucony", "Brooks", "Hoka", "Salomon", "Columbia", "The North Face", "Patagonia", "Arc'teryx", "Mammut", "Black Diamond", "REI", "Decathlon", "Quechua", "Domyos", "Kipsta", "Wilson", "Spalding", "Rawlings", "Easton", "Louisville Slugger", "Head", "Babolat", "Yonex", "Li-Ning", "Victor", "Dunlop", "Penn", "Callaway", "TaylorMade", "Titleist", "Ping", "Cobra", "Mizuno", "Srixon", "Bridgestone", "Trek", "Giant", "Specialized", "Cannondale", "Scott", "Merida", "Bianchi", "Shimano", "SRAM", "Generic"],

automotive: ["Custom/Other", "Bosch", "3M", "Michelin", "Goodyear", "Bridgestone", "Pirelli", "Continental", "Dunlop", "Yokohama", "Hankook", "BFGoodrich", "Castrol", "Mobil", "Shell", "Valvoline", "Pennzoil", "Meguiar's", "Turtle Wax", "Chemical Guys", "Mothers", "Armor All", "Rain-X", "WeatherTech", "Husky Liners", "Garmin", "TomTom", "Pioneer", "Kenwood", "Alpine", "JBL", "Sony", "Blaupunkt", "Nextbase", "BlackVue", "Thinkware", "Generic"],

books: ["Custom/Other", "Penguin Random House", "HarperCollins", "Simon & Schuster", "Macmillan", "Hachette", "Scholastic", "Oxford University Press", "Cambridge University Press", "McGraw-Hill", "Pearson", "Wiley", "Elsevier", "Springer", "Marvel", "DC Comics", "Dark Horse", "Image Comics", "IDW", "Viz Media", "Kodansha", "Shueisha", "Generic"],

groceries: ["Custom/Other", "Coca-Cola", "Pepsi", "Nestle", "Cadbury", "Mars", "Ferrero", "Lindt", "Hershey's", "Toblerone", "Kit Kat", "Snickers", "M&Ms", "Twix", "Milka", "Lay's", "Pringles", "Doritos", "Cheetos", "Ruffles", "Tostitos", "Oreo", "Ritz", "Nabisco", "Kellogg's", "General Mills", "Quaker", "Post", "Nestle", "Lipton", "Tetley", "Twinings", "Yorkshire Tea", "PG Tips", "Nescafe", "Folgers", "Maxwell House", "Starbucks", "Lavazza", "Illy", "Generic"],

pets: ["Custom/Other", "Pedigree", "Royal Canin", "Purina", "Hill's Science Diet", "Blue Buffalo", "Iams", "Eukanuba", "Nutro", "Wellness", "Taste of the Wild", "Orijen", "Acana", "Merrick", "Whiskas", "Friskies", "Fancy Feast", "Sheba", "9Lives", "Meow Mix", "Kong", "Chuckit", "Nylabone", "Outward Hound", "Petmate", "Ferplast", "Trixie", "Generic"],

jewelry: ["Custom/Other", "Tiffany & Co", "Cartier", "Bulgari", "Van Cleef & Arpels", "Harry Winston", "Chopard", "Graff", "Boucheron", "Piaget", "Buccellati", "David Yurman", "Pandora", "Swarovski", "Alex and Ani", "James Avery", "Kay Jewelers", "Zales", "Jared", "Blue Nile", "Brilliant Earth", "Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "TAG Heuer", "Breitling", "IWC", "Jaeger-LeCoultre", "Panerai", "Hublot", "Zenith", "Longines", "Tissot", "Hamilton", "Seiko", "Citizen", "Casio", "Timex", "Fossil", "Michael Kors", "Guess", "Nixon", "G-Shock", "Fitbit", "Garmin", "Generic"],

office: ["Custom/Other", "HP", "Canon", "Epson", "Brother", "Xerox", "Ricoh", "Konica Minolta", "Sharp", "Kyocera", "Lexmark", "Dell", "Fellowes", "Swingline", "Scotch", "3M", "Post-it", "Sharpie", "BIC", "Pilot", "Pentel", "Uni-ball", "Parker", "Waterman", "Cross", "Lamy", "Montblanc", "Moleskine", "Leuchtturm1917", "Rhodia", "Clairefontaine", "Five Star", "Mead", "Staples", "Office Depot", "Generic"],

garden: ["Custom/Other", "Scotts", "Miracle-Gro", "Roundup", "Ortho", "Bayer", "Bonide", "Safer Brand", "Espoma", "Jobe's", "FoxFarm", "Black Gold", "Promix", "Fiskars", "Corona", "Felco", "Gardena", "Husqvarna", "Stihl", "Black+Decker", "Toro", "Ryobi", "Greenworks", "EGO", "Weber", "Char-Broil", "Traeger", "Big Green Egg", "Kamado Joe", "Generic"],

industrial: ["Custom/Other", "DeWalt", "Makita", "Milwaukee", "Bosch", "Hitachi", "Ryobi", "Black+Decker", "Craftsman", "Stanley", "Irwin", "Klein Tools", "Channellock", "Knipex", "Wera", "Wiha", "Snap-on", "Mac Tools", "Matco", "Bahco", "Facom", "Gedore", "3M", "Honeywell", "MSA", "Moldex", "Uvex", "Ansell", "Mechanix", "Carhartt", "Dickies", "Generic"]
};

// Export for use in other modules
export { categoryHierarchy, brandsByCategory };