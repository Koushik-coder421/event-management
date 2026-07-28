const Club = require('../models/clubModel');
const User = require('../models/userModel');
const { deleteFile } = require('../utils/fileUtils');
const { syncExcelFile } = require('./registrationController');

exports.createClub = async (req, res) => {
    try {
        const { clubName, description, logoUrl, email, password } = req.body;

        if (!clubName) {
            return res.status(400).json({ message: 'Club name is required' });
        }

        let managerId = req.user.id; // Default to current user (SuperAdmin)

        // If email and password are provided, create a new ClubAdmin user
        if (email && password) {
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use for a manager account' });
            }

            managerId = await User.create({
                name: `${clubName} Manager`,
                email,
                password,
                role: 'ClubAdmin',
                department: clubName
            });
        }

        const clubId = await Club.create({
            clubName,
            description,
            logoUrl,
            createdBy: managerId
        });

        res.status(201).json({ message: 'Category launched and manager account created!', clubId });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Club name already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.findAll();
        res.json(clubs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getClubById = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }
        res.json(club);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        // Only Admin or Super Admin should be able to delete clubs
        const userRole = (req.user.role || req.user.Role || '').toLowerCase();
        if (userRole !== 'admin' && userRole !== 'super admin') {
            return res.status(403).json({ message: 'Unauthorized to delete categories' });
        }

        // 1. Store the manager's ID and file info
        const managerId = club.CreatedBy;
        const logoUrl = club.LogoURL || club.logoUrl;

        // 2. Delete the logo file
        if (logoUrl) deleteFile(logoUrl);

        // 3. Delete the club (This will cascade delete events)
        await Club.delete(req.params.id);

        // 3. Delete the manager's user account if it exists and isn't the current admin
        if (managerId && managerId !== req.user.id) {
            const manager = await User.findById(managerId);
            if (manager) {
                const managerEmail = (manager.Email || manager.email || '').toLowerCase();
                const managerRole = (manager.Role || manager.role || '').toLowerCase();

                // PROTECTION: do not delete the user if they are admin100@gmail.com or have an Admin role
                if (managerEmail !== 'admin100@gmail.com' && managerRole !== 'admin' && managerRole !== 'super admin') {
                    await User.delete(managerId);
                }
            }
        }

        await syncExcelFile();
        res.json({ message: 'Category and manager account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
