const SessionClientModel = require('../../models/session');
const InvoiceService = require('../../services/invoice.service');
const { ObjectId } = require('mongoose').Types;

// Create - POST request handler
exports.createItem = async (req, res) => {

  try {
    // Create new item using request body
    let newItem = new SessionClientModel(req.body);

    newItem['createdBy'] = req.authData.id;
    // const defaultDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    // newItem['startTime'] = `${defaultDate}T${req.body.startTime}`;
    // newItem['endTime'] = req.body.endTime ? `${defaultDate}T${req.body.endTime}` : defaultDate;

    // Save item to database
    const savedItem = await newItem.save();
    InvoiceService.setData({ 
        message: 'Hello from Controller 1',
        setDataTyep: 'create',
        savedItem,
    });

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
    const items = await SessionClientModel.find({brancheId}).sort({ createdAt: -1, activeState: 1 });
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
    const items = await SessionClientModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    // Count total number of items (for pagination)
    const totalCount = await SessionClientModel.countDocuments(filter);

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
    const item = await SessionClientModel.findById(req.params.id);
    if (!item) {
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

// Update - PUT request handler
exports.updateItem = async (req, res) => {
  try {
    // Update item by ID in database
    const updatedItem = await SessionClientModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    InvoiceService.setData({ 
      message: 'Hello from Controller 1',
      setDataTyep: 'update',
      updatedItem,
    });
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  '',
      data: [updatedItem]
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
    const deletedItem = await SessionClientModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  '',
      data: [deletedItem]
  });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete - DELETE request handler
exports.deleteSessionItem = async (req, res) => {
  try {
    // Delete item by ID from database
    const deletedItem = await SessionClientModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    InvoiceService.setData({ 
      message: 'Hello from Controller 1',
      setDataTyep: 'end',
      deletedItem,
      endIn: req.params.endIn
    });

    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  '',
      data: [deletedItem]
  });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete - DELETE request handler
exports.deleteAllReletedToBill = async (req, res) => {
  try {

    console.log('deleteAllReletedToBill req.params', req.params);

    let ids = req.params.id.split(',');
    idsToDelete = ids.map(id => new ObjectId(id))

    // const deleteResult = await SessionClientModel.deleteMany({ _id: { $in: idsToDelete }  });

    let deletedList = await SessionClientModel.deleteMany({ _id: { $in: idsToDelete }  });
    
    // console.log('deleteAllReletedToBill deletedList', deletedList);
    // console.log('deleteAllReletedToBill idsToDelete', idsToDelete);
 
    InvoiceService.setData({ 
      message: 'Hello from Controller 1',
      setDataTyep: 'endList',
      idsToDelete,
      endIn: req.params.endIn
    });
    
    // for (const id of idsToDelete) {
      
    //   console.log('deleteAllReletedToBill id', id);

    //   let deletedItem = await SessionClientModel.findByIdAndDelete(id);
    //   // console.log('deleteAllReletedToBill deletedItem', deletedItem);
      
    //   // if (!deletedItem) {
    //   //   return res.status(404).json({ msg: 'Item not found' });
    //   // }
    //   console.log('deleteAllReletedToBill deletedItem 222', deletedItem);
    //   // await 
    //   }

    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  ids,
      data: ids
  });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};