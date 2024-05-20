const BrancheModel = require('../../models/branche');

// Create - POST request handler
exports.createItem = async (req, res) => {
  // Validate request body using express-validator
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  try {
    // Create new item using request body
    let newItem = new BrancheModel(req.body);

    newItem['ownerId'] = req.authData.id;
    // Save item to database
    const savedItem = await newItem.save();
    res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message:  '',
          data: [savedItem]
      });
  } catch (err) {
    console.error('err.message -->',err.message);
    res.status(500)
      .json({
        success: false,
        errors: [ err.message ],
        status: 500,
        message:  '',
        data: {}
      });
    // .send('Server Error');
  }
};

// Read - GET request handler (Get all items)
exports.getAllItems = async (req, res) => {

  let filter = JSON.parse(req.query.Filter);

  let {ownerId, brancheId} = filter;

  const pageSize = +req.query.PageSize > 0 ? req.query.PageSize : 15;
  const pageNo   = +req.query.PageNo > 0 ? req.query.PageNo : 1 ;

  try {
    // Fetch all items from database
    const items = await BrancheModel.find({ownerId}).sort({ createdAt: -1, activeState: 1 })
    // .skip((pageNo - 1) * pageSize).limit(pageSize);
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  '',
      data: items
  });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Read - GET request handler (Get all items with pagination and filtering)
exports.getAllItemsPagination = async (req, res) => {
  try {
    let { page = 1, limit = 10, filterBy, filterValue } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Build filter object based on query parameters
    let filter = {};
    if (filterBy && filterValue) {
      filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
    }

    // Fetch items from database with pagination and filtering
    const items = await BrancheModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    // Count total number of items (for pagination)
    const totalCount = await BrancheModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
        },
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Read - GET request handler (Get item by ID)
exports.getItemById = async (req, res) => {
  try {
    // Fetch item by ID from database
    const item = await BrancheModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201)
        .json({
          success: true,
          errors: [],
          status: 200,
          message:  '',
          data: [item]
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update - PUT request handler
exports.updateItem = async (req, res) => {
  try {
    // Update item by ID in database
    const updatedItem = await BrancheModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  '',
      data: {}
  });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete - DELETE request handler
exports.deleteItem = async (req, res) => {
  try {
    // Delete item by ID from database
    const deletedItem = await BrancheModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  '',
      data: {}
  });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
