const Auth         = require('../../models/auth')
const Invoice      = require('../../models/invoice')
const { ObjectId } = require('mongoose').Types;

exports.getGroupedInvoicesByClosedBy = async (req, res) => {

  let filter = JSON.parse(req.query.Filter);

  let {ownerId, brancheId, startDate, endDate, activeState} = filter;

  // startDate, endDate
  console.log('filter', filter);

  try {
    const invoices = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          brancheId: ObjectId(brancheId),
          activeState: activeState
        }
      },
      {
        $group: {
          _id: "$closedBy",
          invoices: { $push: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: 'auths',
          localField: '_id',
          foreignField: '_id',
          as: 'closedByUser'
        }
      },
      {
        $unwind: {
          path: "$closedByUser",
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    res.status(201)
    .json({
        success: true,
        errors: [],
        status: 200,
        message:  '',
        data: invoices
    });

    // return invoices;
  } catch (error) {
    console.error("Error fetching grouped invoices:", error);
    res.status(500)
    .json({
        success: true,
        errors: [error],
        status: 200,
        message:  '',
        data: []
    });

  }
}

