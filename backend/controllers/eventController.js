const Event = require('../models/eventModel');
const { deleteFile } = require('../utils/fileUtils');
const { syncExcelFile } = require('./registrationController');

exports.createEvent = async (req, res) => {
    try {
        const { eventTitle, description, rules, eventType, teamSize, entryFee, date, time, venue, posterUrl, qrCode, maxParticipants, registrationDeadline, clubId } = req.body;

        if (!eventTitle || !date || !time || !venue || !clubId) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const eventId = await Event.create({
            eventTitle,
            description,
            rules,
            eventType,
            teamSize,
            entryFee: entryFee || 0,
            date,
            time,
            venue,
            posterUrl,
            qrCode,
            maxParticipants,
            registrationDeadline,
            clubId
        });

        res.status(201).json({ message: 'Event created successfully', eventId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Auth check
        if (req.user.role !== 'Admin' && req.user.role !== 'admin' && req.user.role !== 'Super Admin') {
            const [clubs] = await require('../config/db').execute('SELECT ClubID FROM Clubs WHERE CreatedBy = ?', [req.user.id]);
            const userClubId = clubs[0]?.ClubID;

            if (event.ClubID !== userClubId) {
                return res.status(403).json({ message: 'Unauthorized to update this event' });
            }
        }

        const success = await Event.update(eventId, req.body);
        if (success) {
            syncExcelFile().catch(err => console.error("Event update sync skip:", err));
            res.json({ message: 'Event updated successfully' });
        } else {
            res.status(400).json({ message: 'Failed to update event' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Logic check: SuperAdmin can delete any. ClubAdmin can delete their own.
        // req.user is populated by protect middleware
        if (req.user.role !== 'Admin' && req.user.role !== 'admin' && req.user.role !== 'Super Admin') {
            // It's a ClubAdmin. Check if the event belongs to their club.
            // We need to fetch the club associated with this user
            const [clubs] = await require('../config/db').execute('SELECT ClubID FROM Clubs WHERE CreatedBy = ?', [req.user.id]);
            const userClubId = clubs[0]?.ClubID;

            if (event.ClubID !== userClubId) {
                return res.status(403).json({ message: 'Unauthorized to delete this event' });
            }
        }

        // Delete associated files
        if (event.PosterURL) deleteFile(event.PosterURL);
        if (event.QRCode) deleteFile(event.QRCode);

        const success = await Event.delete(eventId);
        if (success) {
            syncExcelFile().catch(err => console.error("Event delete sync skip:", err));
            res.json({ message: 'Event deleted successfully' });
        } else {
            res.status(400).json({ message: 'Failed to delete event' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
