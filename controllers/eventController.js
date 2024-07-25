const Event = require("../models/eventModel");

exports.createEvent = async (req, res, next) => {
  const event = await Event.create(req.body);

  if (!event) {
    res.status(404).json({
      status: "Error",
      message: "Not able to create event",
    });
  }

  res.status(200).json({
    status: "success",
    data: event,
  });
};

exports.getAllEvent = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 21;
  const keyword = req.query.keyword;
  const category = req.query.category;
  let skip = 0;
  let events = [];
  let tpages = 0;

  switch (category) {
    case "all":
      skip = (page - 1) * limit;
      events = await Event.find().skip(skip).limit(limit);
      tpages = Math.ceil((await Event.countDocuments()) / limit);
      break;
    case "location":
      skip = (page - 1) * limit;
      events = await Event.find({
        location: { $regex: keyword, $options: "i" },
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({
          location: { $regex: keyword, $options: "i" },
        })) / limit
      );
      break;
    case "699":
      skip = (page - 1) * limit;
      events = await Event.find({
        ticketprice: { $lte: parseInt(category) },
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({
          ticketprice: { $lte: parseInt(category) },
        })) / limit
      );

      break;
    case "Adventure":
      skip = (page - 1) * limit;
      events = await Event.find({
        eventType: keyword,
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({ eventType: keyword })) / limit
      );
      break;
    case "Events":
      events = await Event.find({
        eventType: keyword,
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({ eventType: keyword })) / limit
      );
      break;
    case "Plays":
      events = await Event.find({
        eventType: keyword,
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({ eventType: keyword })) / limit
      );
      break;
    case "Sports":
      events = await Event.find({
        eventType: keyword,
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({ eventType: keyword })) / limit
      );
      break;
    case "Activities":
      events = await Event.find({
        eventType: keyword,
      })
        .skip(skip)
        .limit(limit);
      tpages = Math.ceil(
        (await Event.countDocuments({ eventType: keyword })) / limit
      );
      break;
  }

  if (!events) {
    res.status(404).json({
      status: "Error",
      message: "Not able to create events",
    });
  }

  res.status(200).json({
    status: "success",
    length: events.length,
    page,
    totalPages: tpages,
    data: events,
  });
};

exports.getEvent = async (req, res, next) => {
  const { eventId } = req.params;
  const id = eventId.split("=")[1];

  const event = await Event.findById(id);

  if (!event) {
    return res.status(404).json({
      status: "Error",
      message: "Error while fetching info",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Data Fetched Successfully",
    data: event,
  });
};

exports.getEventParticular = async function (req, res, next) {
  const { location, keyword } = req.params;
  console.log(location, keyword);

  const event = await Event.find({
    $and: [
      { location: { $regex: location, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  });

  if (!event) {
    return res.status(404).json({
      status: "Error",
      message: "Error while fetching info",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Data Fetched Successfully",
    data: event,
  });
};

exports.getEventsbyLocation = async function (req, res, next) {
  const { eventlocation } = req.params;
  console.log(eventlocation);
  const event = await Event.find({
    Categories: { $regex: eventlocation, $options: "i" },
  });
  if (!event) {
    return res.status(404).json({
      status: "Error",
      message: "Error while fetching info",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Data Fetched Successfully",
    data: event,
  });
};

exports.getEventsbyPrice = async function (req, res, next) {
  try {
    const { eventPrice } = req.params;

    // Ensure eventPrice is a number
    const price = parseInt(eventPrice, 10);
    if (isNaN(price)) {
      return res.status(400).json({
        status: "Error",
        message: "Invalid price parameter",
      });
    }

    const events = await Event.find({
      ticketprice: { $lte: price },
    });

    // Check if any events were found
    if (events.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No events found within the specified price range",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data Fetched Successfully",
      length: events.length,
      data: events,
    });
  } catch (error) {
    // Handle any potential errors
    res.status(500).json({
      status: "Error",
      message: "Error while fetching info",
      error: error.message,
    });
  }
};

exports.getEventsByProps = async function (req, res, next) {
  const { propsKeyword } = req.params;
  const { category } = req.query;
  let event = [];
  console.log(propsKeyword);
  console.log(category);
  switch (category) {
    case "location":
      event = await Event.find({
        location: { $regex: propsKeyword, $options: "i" },
      });
      break;
    case "699":
      event = await Event.find({
        ticketprice: { $lte: parseInt(category) },
      });
      break;
    case "all":
      event = await Event.find().skip(0).limit(15);
      break;
    case "Adventure":
      event = await Event.find({
        eventType: propsKeyword,
      });
      break;
  }

  try {
    if (!event) {
      return res.status(404).json({
        status: "Error",
        message: "Error while fetching info",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data Fetched Successfully",
      data: event,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getAllEventTypes = async function (req, res, next) {
  const EventTypes = await Event.distinct("eventType");
  if (!EventTypes) {
    return res.status(400).json({
      status: "Error",
      message: "Error While Fetching info",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Data Fetched Successfully",
    data: EventTypes,
  });
};

exports.getAllEventIds = async function (req, res, next) {
  const EventIds = await Event.find({}, { _id: 1 });
  if (!EventIds) {
    return res.status(400).json({
      status: "Error",
      message: "Error While Fetching info",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Data Fetched Successfully",
    data: EventIds,
  });
};

exports.getEventbyEventId = async function (req, res, next) {
  const { evtId } = req.params;
  console.log(evtId);
  const event = await Event.findById(evtId);
  if (!event) {
    return res.status(400).json({
      status: "error",
      message: "Failed to fetch",
    });
  }

  res.status(200).json({
    status: "success",
    data: event,
  });
};
