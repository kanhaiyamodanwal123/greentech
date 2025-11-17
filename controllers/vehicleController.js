// controllers/vehicleController.js
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const uploadToCloudinary = require('../utils/uploadToCloudinary'); // <-- correct import


/* ------------------------------
   LIST VEHICLES (PUBLIC)
--------------------------------*/
exports.listVehicles = async (req, res) => {
  try {
    const { location } = req.query;
    const filter = { isVerified: true };

    if (location && location !== "All Locations") {
      filter.location = { $regex: location, $options: "i" };
    }

    const vehicles = await Vehicle.find(filter).populate("owner").lean();

    res.render("vehicles/list", {
      vehicles,
      user: req.user,
      searchLocation: location || "All Locations"
    });

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Unable to load vehicles");
    res.redirect("/");
  }
};


/* ------------------------------
   VEHICLE DETAILS
--------------------------------*/
exports.getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("owner")
      .lean();

    if (!vehicle) {
      req.flash("error_msg", "Vehicle not found");
      return res.redirect("/vehicles");
    }

    res.render("vehicles/details", { vehicle, user: req.user });

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Server error");
    res.redirect("/vehicles");
  }
};


/* ------------------------------
   OWNER DASHBOARD
--------------------------------*/
exports.ownerDashboard = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id }).lean();

    const bookingRequests = await Booking.find({
      vehicle: { $in: vehicles.map(v => v._id) }
    })
      .populate("vehicle")
      .populate("renter")
      .lean();

    res.render("vehicles/ownerDashboard", {
      vehicles,
      bookingRequests,
      user: req.user
    });

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading dashboard");
    res.redirect("/vehicles");
  }
};


/* ------------------------------
   SHOW ADD VEHICLE PAGE
--------------------------------*/
exports.getAddVehicle = (req, res) => {
  if (!req.user) return res.redirect("/users/login");

  if (req.user.role !== "owner") {
    req.flash("error_msg", "Only owners can add vehicles.");
    return res.redirect("/vehicles");
  }

  res.render("vehicles/add", { user: req.user });
};


/* ------------------------------
   ADD VEHICLE (CLOUDINARY)
--------------------------------*/
exports.postAddVehicle = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    if (!ownerId) {
      req.flash("error_msg", "Please login first");
      return res.redirect("/users/login");
    }

    const {
      title, type, description, modelYear, mileage,
      pricePerDay, pricePerWeek, pricePerMonth, location
    } = req.body;

    const files = req.files;

    // Required validation
    const missingFiles = [];
    if (!files?.images?.length) missingFiles.push("Vehicle Images");
    if (!files?.rcFile?.length) missingFiles.push("RC Document");
    if (!files?.insuranceFile?.length) missingFiles.push("Insurance Document");
    if (!files?.pollutionFile?.length) missingFiles.push("Pollution Document");

    if (missingFiles.length > 0) {
      req.flash("error_msg", "Missing: " + missingFiles.join(", "));
      return res.redirect("/vehicles/add");
    }

    /* ---- CLOUDINARY UPLOAD ---- */
  const imageUrls = [];
for (const img of files.images) {
  const url = await uploadToCloudinary(img.buffer, "bike_rental/vehicles");
  imageUrls.push(url);
}

const rcUrl = await uploadToCloudinary(files.rcFile[0].buffer, "bike_rental/documents");
const insuranceUrl = await uploadToCloudinary(files.insuranceFile[0].buffer, "bike_rental/documents");
const pollutionUrl = await uploadToCloudinary(files.pollutionFile[0].buffer, "bike_rental/documents");


    /* ---- SAVE VEHICLE ---- */
    const vehicle = new Vehicle({
      owner: ownerId,
      title,
      type,
      description,
      modelYear,
      mileage,
      location,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      images: imageUrls,
      rcFile: rcUrl,
      insuranceFile: insuranceUrl,
      pollutionFile: pollutionUrl,
      isVerified: false
    });

    await vehicle.save();

    req.flash("success_msg", "Vehicle added! Waiting admin approval.");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error("CLOUDINARY UPLOAD ERROR:", err);
    req.flash("error_msg", "Upload failed. Try again.");
    res.redirect("/vehicles/add");
  }
};


/* ------------------------------
   EDIT VEHICLE
--------------------------------*/
exports.getEditVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();

    if (!vehicle) {
      req.flash("error_msg", "Vehicle not found");
      return res.redirect("/vehicles/owner/dashboard");
    }

    res.render("vehicles/edit", { vehicle, user: req.user });

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading vehicle");
    res.redirect("/vehicles/owner/dashboard");
  }
};


exports.postEditVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      req.flash("error_msg", "Vehicle not found");
      return res.redirect("/vehicles/owner/dashboard");
    }

    const {
      title, type, description, modelYear, mileage,
      pricePerDay, pricePerWeek, pricePerMonth, location
    } = req.body;

    vehicle.title = title;
    vehicle.type = type;
    vehicle.description = description;
    vehicle.modelYear = modelYear;
    vehicle.mileage = mileage;
    vehicle.location = location;
    vehicle.pricePerDay = pricePerDay;
    vehicle.pricePerWeek = pricePerWeek;
    vehicle.pricePerMonth = pricePerMonth;

    const files = req.files;

    // Replace images/documents if new ones uploaded
   if (files?.images?.length) {
  vehicle.images = [];
  for (const img of files.images) {
    const url = await uploadToCloudinary(img.buffer, "bike_rental/vehicles");
    vehicle.images.push(url);
  }
}

if (files?.rcFile) {
  vehicle.rcFile = await uploadToCloudinary(files.rcFile[0].buffer, "bike_rental/documents");
}

if (files?.insuranceFile) {
  vehicle.insuranceFile = await uploadToCloudinary(files.insuranceFile[0].buffer, "bike_rental/documents");
}

if (files?.pollutionFile) {
  vehicle.pollutionFile = await uploadToCloudinary(files.pollutionFile[0].buffer, "bike_rental/documents");
}


    await vehicle.save();

    req.flash("success_msg", "Vehicle updated successfully!");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error updating vehicle");
    res.redirect(`/vehicles/edit/${req.params.id}`);
  }
};


/* ------------------------------
   DELETE VEHICLE
--------------------------------*/
exports.deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Vehicle deleted");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error deleting vehicle");
    res.redirect("/vehicles/owner/dashboard");
  }
};


/* ------------------------------
   BOOKING SYSTEM
--------------------------------*/
exports.bookVehicle = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "renter") {
      req.flash("error_msg", "Only renters can book vehicles");
      return res.redirect("/vehicles");
    }

    const { startDate, endDate, totalAmount } = req.body;

    const booking = new Booking({
      vehicle: req.params.id,
      renter: req.user._id,
      startDate,
      endDate,
      totalAmount,
      status: "pending"
    });

    await booking.save();

    req.flash("success_msg", "Booking request sent!");
    res.redirect("/bookings/my");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error booking vehicle");
    res.redirect("/vehicles");
  }
};



/* ------------------------------
   OWNER ACCEPT / REJECT
--------------------------------*/
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      req.flash("error_msg", "Booking not found");
      return res.redirect("/vehicles/owner/dashboard");
    }

    if (String(booking.vehicle.owner) !== String(req.user._id)) {
      req.flash("error_msg", "Not authorized");
      return res.redirect("/vehicles/owner/dashboard");
    }

    booking.status = "accepted";
    await booking.save();

    req.flash("success_msg", "Booking accepted");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error accepting booking");
    res.redirect("/vehicles/owner/dashboard");
  }
};


exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle");

    if (!booking) {
      req.flash("error_msg", "Booking not found");
      return res.redirect("/vehicles/owner/dashboard");
    }

    if (String(booking.vehicle.owner) !== String(req.user._id)) {
      req.flash("error_msg", "Not authorized");
      return res.redirect("/vehicles/owner/dashboard");
    }

    booking.status = "rejected";
    await booking.save();

    req.flash("success_msg", "Booking rejected");
    res.redirect("/vehicles/owner/dashboard");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error rejecting booking");
    res.redirect("/vehicles/owner/dashboard");
  }
};


/* ------------------------------
   COMPLETE BOOKING
--------------------------------*/
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      req.flash("error_msg", "Booking not found");
      return res.redirect("/bookings/my");
    }

    if (String(booking.renter) !== String(req.user._id)) {
      req.flash("error_msg", "Not authorized");
      return res.redirect("/bookings/my");
    }

    const { review, rating } = req.body;

    booking.status = "completed";
    booking.review = review;
    booking.rating = rating;

    await booking.save();

    req.flash("success_msg", "Thank you for your review!");
    res.redirect("/bookings/my");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error completing booking");
    res.redirect("/bookings/my");
  }
};
