import Contact from "../models/Contact.js";

// @desc    Submit Contact Form
// @route   POST /api/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields for backend sanitization and security
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required. Please complete the form before submitting.",
      });
    }

    // Initialize a new entry instance with trimmed and sanitized properties
    const newContact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Persist the support inquiry message to the database
    await newContact.save();

    // Return a successful response to the client application
    return res.status(201).json({
      success: true,
      message:
        "Your message has been received successfully. Thank you for contacting us.",
    });
  } catch (error) {
    console.error("CONTACT_FORM_SUBMIT_ERROR:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while transmitting your message. Please try again later.",
    });
  }
};

export { submitContactForm };
