const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const YourModel = require('../models/YourModel');

// Create - POST request handler
exports.createItem = async (req, res) => {
  // Validate request body using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Create new item using request body
    const newItem = new YourModel(req.body);
    // Save item to database
    const savedItem = await newItem.save();
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  token,
      data: {}
  });;
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Read - GET request handler (Get all items)
exports.getAllItems = async (req, res) => {
  try {
    // Fetch all items from database
    const items = await YourModel.find();
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  token,
      data: {}
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
    const item = await YourModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201)
    .json({
      success: true,
      errors: [],
      status: 200,
      message:  token,
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
    const updatedItem = await YourModel.findByIdAndUpdate(
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
        message:  token,
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
    const deletedItem = await YourModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(201)
      .json({
        success: true,
        errors: [],
        status: 200,
        message:  token,
        data: {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
