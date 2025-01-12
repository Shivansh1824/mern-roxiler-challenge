const axios = require('axios');
const Product = require('../models/Product');

// Initialize Database
exports.initializeDatabase = async (req, res) => {
  try {
    // Fetch data from third party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const products = response.data;

    // Clear existing data
    await Product.deleteMany({});

    // Insert new data
    await Product.insertMany(products);

    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Error initializing database' });
  }
};

// List Transactions
exports.listTransactions = async (req, res) => {
    try {
        const { month, search = '', page = 1, perPage = 10 } = req.query;
        
        const pipeline = [
            // Month filtering stage
            {
                $addFields: {
                    monthOfSale: { $month: "$dateOfSale" }
                }
            },
            {
                $match: {
                    monthOfSale: Number(month)
                }
            }
        ];

        // Add search conditions if search exists
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { price: isNaN(search) ? null : Number(search) }
                    ]
                }
            });
        }

        // Pagination stages
        const skip = (page - 1) * perPage;
        pipeline.push(
            { $skip: skip },
            { $limit: Number(perPage) }
        );

        // Count total documents
        const countPipeline = [
            ...pipeline.slice(0, 2), // Keep only month filtering stages
            { $count: "total" }
        ];

        const [transactions, totalCount] = await Promise.all([
            Product.aggregate(pipeline),
            Product.aggregate(countPipeline)
        ]);

        res.json({
            transactions,
            total: totalCount[0]?.total || 0,
            page: Number(page),
            perPage: Number(perPage),
            totalPages: Math.ceil((totalCount[0]?.total || 0) / perPage)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Statistics
exports.getStatistics = async (req, res) => {
    try {
        const { month } = req.query;
        
        const monthQuery = {
            $expr: {
                $eq: [{ $month: '$dateOfSale' }, parseInt(month)]
            }
        };

        const stats = await Product.aggregate([
            { $match: monthQuery },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$price' },
                    soldItems: {
                        $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] }
                    },
                    notSoldItems: {
                        $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalAmount: 0,
            soldItems: 0,
            notSoldItems: 0
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Bar Chart Data
exports.getBarChartData = async (req, res) => {
    try {
        const { month } = req.query;

        const ranges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }
        ];

        const monthQuery = {
            $expr: {
                $eq: [{ $month: '$dateOfSale' }, parseInt(month)]
            }
        };

        const result = await Promise.all(
            ranges.map(async ({ min, max }) => {
                const count = await Product.countDocuments({
                    ...monthQuery,
                    price: { $gte: min, $lt: max === Infinity ? 999999 : max }
                });
                return {
                    range: `${min}-${max === Infinity ? 'above' : max}`,
                    count
                };
            })
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Pie Chart Data
exports.getPieChartData = async (req, res) => {
    try {
        const { month } = req.query;

        const result = await Product.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: '$dateOfSale' }, parseInt(month)]
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(result.map(item => ({
            category: item._id,
            count: item.count
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Replace only the getCombinedData function in your productController.js
exports.getCombinedData = async (req, res) => {
    try {
        const month = parseInt(req.query.month);
        
        // Validate month
        if (isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid month. Please provide a month between 1 and 12' });
        }

        // Get all data in parallel using existing functions
        const monthQuery = {
            $expr: {
                $eq: [{ $month: '$dateOfSale' }, month]
            }
        };

        // Statistics
        const stats = await Product.aggregate([
            { $match: monthQuery },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$price' },
                    soldItems: {
                        $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] }
                    },
                    notSoldItems: {
                        $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalAmount: { $round: ['$totalAmount', 2] },
                    soldItems: 1,
                    notSoldItems: 1
                }
            }
        ]);

        // Bar Chart Data
        const ranges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }
        ];

        const barChartData = await Promise.all(
            ranges.map(async ({ min, max }) => {
                const count = await Product.countDocuments({
                    ...monthQuery,
                    price: { $gte: min, $lt: max === Infinity ? 999999 : max }
                });
                return {
                    range: `${min}-${max === Infinity ? 'above' : max}`,
                    count
                };
            })
        );

        // Pie Chart Data
        const pieChartData = await Product.aggregate([
            {
                $match: monthQuery
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    count: 1
                }
            }
        ]);

        // Combine all data
        res.status(200).json({
            statistics: stats[0] || {
                totalAmount: 0,
                soldItems: 0,
                notSoldItems: 0
            },
            barChart: barChartData,
            pieChart: pieChartData
        });

    } catch (error) {
        console.error('Error in getCombinedData:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};