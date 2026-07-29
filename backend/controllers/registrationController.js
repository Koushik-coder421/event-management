const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { deleteFile } = require('../utils/fileUtils');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY
    }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("[MAIL] Transporter Configuration Error:", error);
    } else {
        console.log("[MAIL] Server is ready to take our messages");
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, name, event, otp, teamName) => {
    if (!email) return;

    // Intelligent Image Handler for Emails
    let posterUrl = event.PosterURL;

    // Check if URL is empty, relative (/uploads/...), or local (localhost)
    // Gmail/Outlook cannot resolve relative or local paths.
    if (!posterUrl ||
        posterUrl.startsWith('/') ||
        posterUrl.includes('localhost') ||
        posterUrl.includes('127.0.0.1')) {

        // Use a high-quality fallback image service
        // Cyan background with white text for the event title
        posterUrl = `https://dummyimage.com/600x400/020617/22d3ee.png&text=${encodeURIComponent(event.EventTitle)}`;
    }

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #020617; color: #f8fafc; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <!-- Header Image Container -->
        <div style="width: 100%; height: 300px; background-color: #0c112b; text-align: center; overflow: hidden;">
            <img src="${posterUrl}" width="600" style="width: 100%; height: 100%; object-fit: cover; display: block; border: 0;" alt="${event.EventTitle}" />
        </div>
        
        <div style="padding: 40px; background-color: #020617;">
            <div style="display: inline-block; padding: 6px 12px; background-color: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 100px; color: #22d3ee; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">
                Entry Manifest Confirmed
            </div>
            
            <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -1px;">${event.EventTitle}</h1>
            <p style="color: #94a3b8; font-size: 16px; margin-top: 8px;">Hello ${name}, your registration is successful!</p>

            ${teamName ? `
            <div style="margin-top: 24px; padding: 16px; background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.1); border-radius: 16px;">
                <p style="margin: 0; font-size: 10px; color: #f59e0b; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Team Identity</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #fbbf24;">${teamName}</p>
            </div>
            ` : ''}

            <!-- Event Details -->
            <div style="margin-top: 32px; display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
                <div style="margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Location</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #e2e8f0;">${event.Venue}</p>
                </div>
                <div style="display: flex; gap: 40px;">
                    <div>
                        <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Schedule</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #e2e8f0;">${new Date(event.Date).toLocaleDateString()} @ ${event.Time}</p>
                    </div>
                </div>
            </div>

            <!-- OTP Card -->
            <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 20px; text-align: center; box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3);">
                <p style="margin: 0; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px;">Your Personal Entry OTP</p>
                <div style="margin: 16px 0; font-size: 48px; font-weight: 900; color: #ffffff; letter-spacing: 12px; font-family: monospace;">${otp}</div>
                <div style="display: inline-block; padding: 4px 12px; background-color: rgba(255,255,255,0.2); border-radius: 100px; color: #ffffff; font-size: 9px; font-weight: 700; text-transform: uppercase;">Unique Access Token</div>
            </div>

            <div style="margin-top: 32px; padding: 16px; background-color: rgba(239, 68, 68, 0.1); border-radius: 12px; border-left: 4px solid #ef4444;">
                <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.5;">
                    <strong>SECURITY PROTOCOL:</strong> This OTP is valid for a <strong>single time entry</strong> only. Do not share this email or the otp with anyone else.
                </p>
            </div>
            
            <p style="margin-top: 40px; font-size: 12px; color: #475569; text-align: center;">
                Generated by CampusConnect Terminal &bull; Managed by ${event.ClubName || 'Organizing Club'} club
            </p>
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"CampusConnect Terminal" <your_verified_email@gmail.com>`,
            to: email,
            subject: `[ENTRY PASS] ${event.EventTitle}`,
            html: htmlContent
        });
        console.log(`[SUCCESS] OTP Email dispatched to ${email}`);
    } catch (error) {
        console.error("[ERROR] Failed to dispatch OTP email:", error);
    }
};

const DETAILS_XLSX_PATH = path.join(__dirname, '..', '..', 'details.xlsx');
const EXPORT_XLSX_PATH = path.join(__dirname, '..', '..', 'registrations_data.xlsx');

// Optimization: Cache for student details to avoid repeated disk reads
let studentDataCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache

const getStudentData = () => {
    const now = Date.now();
    if (studentDataCache && (now - lastCacheUpdate < CACHE_DURATION)) {
        return studentDataCache;
    }

    try {
        if (!fs.existsSync(DETAILS_XLSX_PATH)) return null;
        const workbook = xlsx.readFile(DETAILS_XLSX_PATH);
        const sheetsData = {};
        for (const sheetName of workbook.SheetNames) {
            sheetsData[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }
        studentDataCache = sheetsData;
        lastCacheUpdate = now;
        return studentDataCache;
    } catch (err) {
        console.error("Error reading student Excel:", err);
        return null;
    }
};

exports.verifyRollNumber = async (req, res) => {
    try {
        const { rollNumber, eventId } = req.body;
        if (!rollNumber || !eventId) {
            return res.status(400).json({ message: 'Roll number and Event ID are required' });
        }

        // 1. Check if this roll number already registered for THIS event
        const existing = await Registration.findByRollAndEvent(rollNumber, eventId);
        if (existing) {
            return res.status(400).json({ message: 'You have already registered for this event!' });
        }

        // 2. Check if this roll number is a team member in ANY registration for this event
        const [teamMemberRows] = await require('../config/db').execute(
            'SELECT * FROM Registrations WHERE EventID = ? AND TeamMembers LIKE ?',
            [eventId, `%${rollNumber}%`]
        );
        if (teamMemberRows.length > 0) {
            return res.status(400).json({ message: 'You are already registered as a team member for this event!' });
        }

        // 3. Verify against student database (Excel Cache)
        const allSheetsData = getStudentData();
        if (!allSheetsData) {
            console.error("Student database missing or unreadable");
            return res.status(500).json({ message: 'Verification source file missing' });
        }

        let student = null;
        for (const sheetName in allSheetsData) {
            const data = allSheetsData[sheetName];
            const found = data.find(row => {
                const val = row['roll_no:'] || row['roll_no'] || row['Roll Number'] || row['rollNo'] || row['RollNo'] || row['rollno'];
                return val && val.toString().toLowerCase() === rollNumber.toLowerCase();
            });

            if (found) {
                student = found;
                break;
            }
        }

        if (!student) {
            return res.status(404).json({ message: 'Roll number not found in student database' });
        }

        res.json({ message: 'Roll number verified', student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

exports.registerForEvent = async (req, res) => {
    try {
        const {
            eventId, rollNumber, studentName, email, branch, section, phoneNumber,
            year, semester,
            teamName, teamMembers, transactionId, paymentScreenshot, paymentMode
        } = req.body;

        const userId = req.user ? req.user.id : null;

        if (!eventId || !rollNumber) {
            return res.status(400).json({ message: 'Event ID and Roll Number are required' });
        }

        console.log(`[REGISTRATION] Attempting for Roll: ${rollNumber}, Email: ${email}, Event: ${eventId}`);

        // 1. Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 2. Check for duplicate registration for this event (Duplicate roll number)
        const duplicate = await Registration.findByRollAndEvent(rollNumber, eventId);
        if (duplicate) {
            return res.status(400).json({ message: 'This roll number is already registered for this event' });
        }

        // 3. Save to Database
        // 3. Save to Database
        const entryOTP = generateOTP();
        const regId = await Registration.create({
            userId,
            eventId,
            rollNumber,
            studentName,
            email,
            branch,
            section,
            phoneNumber,
            year,
            semester,
            teamName,
            teamMembers: teamMembers ? JSON.stringify(teamMembers) : null,
            transactionId,
            paymentScreenshot,
            paymentMode,
            entryOTP: entryOTP,
            otpUsed: false
        });

        // 4. Send OTP Email
        sendOTPEmail(email, studentName, event, entryOTP, teamName);


        // 4. Update Excel File (Run in background for performance)
        syncExcelFile().catch(excelErr => console.error("Background Excel sync failed:", excelErr));

        res.status(201).json({ message: 'Registration successful', registrationId: regId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

async function syncExcelFile() {
    try {
        const [rows] = await require('../config/db').execute(
            `SELECT r.*, e.EventTitle, e.EventType, e.EventID, c.ClubName 
             FROM Registrations r 
             JOIN Events e ON r.EventID = e.EventID 
             LEFT JOIN Clubs c ON e.ClubID = c.ClubID
             ORDER BY c.ClubName, e.EventTitle, r.RegistrationDate ASC`
        );

        // Group by EventID
        const eventsMap = {};
        rows.forEach(row => {
            if (!eventsMap[row.EventID]) {
                eventsMap[row.EventID] = [];
            }
            eventsMap[row.EventID].push(row);
        });

        const workbook = xlsx.utils.book_new();
        const usedSheetNames = new Set();

        for (const eventId in eventsMap) {
            const eventRows = eventsMap[eventId];
            if (eventRows.length === 0) continue;

            // Prepare data for this event
            const data = eventRows.map((reg, index) => ({
                'No.': index + 1,
                Club: reg.ClubName || 'N/A',
                Event: reg.EventTitle,
                RollNumber: reg.RollNumber,
                Name: reg.StudentName,
                Email: reg.Email || 'N/A',
                Branch: reg.Branch,
                Section: reg.Section,
                PhoneNumber: reg.PhoneNumber || 'N/A',
                Year: reg.Year || 'N/A',
                Semester: reg.Semester || 'N/A',
                Type: reg.EventType,
                TeamName: reg.TeamName || 'N/A',
                TeamMembers: reg.TeamMembers || 'N/A',
                TransactionID: reg.TransactionID,
                PaymentMode: reg.PaymentMode || 'Online',
                PaymentStatus: reg.Status || 'Pending', // Default if undefined
                Timestamp: new Date(reg.RegistrationDate).toLocaleString()
            }));

            // Generate Sheet Name
            // Rules: Max 31 chars, no invalid chars / \ ? * : [ ]
            let baseName = (eventRows[0].EventTitle || "Event").replace(/[\\/?*:[\]]/g, " ").trim();
            // Truncate to allow for potential suffix (e.g. " (1)")
            let sheetName = baseName.substring(0, 31);
            let counter = 1;

            // Ensure uniqueness
            while (usedSheetNames.has(sheetName.toLowerCase())) {
                const suffix = ` (${counter})`;
                const maxBaseLen = 31 - suffix.length;
                sheetName = baseName.substring(0, maxBaseLen) + suffix;
                counter++;
            }

            usedSheetNames.add(sheetName.toLowerCase());

            const worksheet = xlsx.utils.json_to_sheet(data);
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        // Write to file (if no events, creates empty workbook which is valid, or file with no sheets)
        if (workbook.SheetNames.length === 0) {
            // Optional: Add a default empty sheet if prefer to have at least one
            const ws = xlsx.utils.json_to_sheet([{ Info: "No registrations yet" }]);
            xlsx.utils.book_append_sheet(workbook, ws, "Info");
        }

        xlsx.writeFile(workbook, EXPORT_XLSX_PATH);
        console.log("Excel file synced successfully with separate sheets.");
    } catch (err) {
        console.error("Failed to sync Excel file:", err);
    }
}

exports.syncExcelFile = syncExcelFile;

exports.getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Fetch all registrations for this event
        const [rows] = await require('../config/db').execute(
            'SELECT * FROM Registrations WHERE EventID = ? ORDER BY RegistrationDate DESC',
            [eventId]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.getByUserId(req.user.id);
        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cancelRegistration = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const isAdmin = ['Admin', 'admin', 'Super Admin', 'ClubAdmin', 'clubadmin'].includes(req.user.role);

        // Fetch registration to get screenshot URL before deleting
        const [regRows] = await require('../config/db').execute(
            'SELECT PaymentScreenshot FROM Registrations WHERE RegistrationID = ?',
            [registrationId]
        );

        const registration = regRows[0];

        // If admin, we don't need to check ownership
        const result = await Registration.cancel(registrationId, isAdmin ? null : req.user.id);

        if (result === 0) {
            return res.status(404).json({ message: 'Registration not found or not authorized' });
        }

        // Delete the screenshot file
        if (registration && registration.PaymentScreenshot) {
            deleteFile(registration.PaymentScreenshot);
        }

        // Sync Excel after deletion (Background)
        syncExcelFile().catch(excelErr => console.error("Background Excel sync failed:", excelErr));

        res.json({ message: 'Registration deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const userRole = (req.user.role || req.user.Role || '').toLowerCase();

        if (userRole !== 'super admin' && userRole !== 'admin') {
            return res.status(403).json({ 
                message: 'Unauthorized access to report download' 
            });
        }

        // Generate fresh Excel every time
        await syncExcelFile();

        if (fs.existsSync(EXPORT_XLSX_PATH)) {
            res.download(
                EXPORT_XLSX_PATH,
                'Registrations_Master_Report.xlsx'
            );
        } else {
            res.status(404).json({ 
                message: 'Report file not generated yet' 
            });
        }

    } catch (error) {
        console.error("Download Error:", error);
        res.status(500).json({ 
            message: 'Error generating download' 
        });
    }
};
exports.downloadClubReport = async (req, res) => {
    try {
        const userRole = (req.user.role || req.user.Role || '').toLowerCase();

        if (
            userRole !== 'clubadmin' &&
            userRole !== 'admin' &&
            userRole !== 'super admin'
        ) {
            return res.status(403).json({
                message: 'Unauthorized access'
            });
        }


        // Get correct user id from token
        const userId =
            req.user.id ||
            req.user.UserID ||
            req.user.userId;


        console.log("Club report requested by user:", userId);


        // Find club owned by this manager
        const [clubs] = await require('../config/db').execute(
            'SELECT ClubID, ClubName FROM Clubs WHERE CreatedBy = ?',
            [userId]
        );


        console.log("Club details:", clubs);


        if (clubs.length === 0) {
            return res.status(404).json({
                message: 'No club associated with this account'
            });
        }


        const myClub = clubs[0];


        // Get events of this club
        const [events] = await require('../config/db').execute(
            'SELECT EventID, EventTitle FROM Events WHERE ClubID = ?',
            [myClub.ClubID]
        );


        if (events.length === 0) {
            return res.status(404).json({
                message: 'No events found for this club'
            });
        }


        const workbook = xlsx.utils.book_new();


        for (const event of events) {

            const [registrations] = await require('../config/db').execute(
                'SELECT * FROM Registrations WHERE EventID = ? ORDER BY RegistrationDate DESC',
                [event.EventID]
            );


            const data = registrations.map(reg => ({
                ...reg,
                TeamMembers:
                    typeof reg.TeamMembers === 'string'
                    ? reg.TeamMembers
                    : JSON.stringify(reg.TeamMembers)
            }));


            const worksheet = xlsx.utils.json_to_sheet(data);


            let sheetName = event.EventTitle
                .substring(0, 31)
                .replace(/[\[\]\*\?\/\\]/g, '');


            xlsx.utils.book_append_sheet(
                workbook,
                worksheet,
                sheetName || "Event"
            );
        }


        if (workbook.SheetNames.length === 0) {
            return res.status(404).json({
                message: 'No registrations found for this club'
            });
        }


        const tempPath = path.join(
            process.cwd(),
            `Report_${myClub.ClubName.replace(/\s+/g, '_')}.xlsx`
        );


        xlsx.writeFile(workbook, tempPath);


        res.download(
            tempPath,
            `Registrations_${myClub.ClubName}.xlsx`,
            (err) => {
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            }
        );


    } catch (error) {

        console.error("Club Download Error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

exports.verifyEntryOTP = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        if (!eventId || !otp) {
            return res.status(400).json({ message: 'Event ID and OTP are required' });
        }

        // Find registration
        const [rows] = await require('../config/db').execute(
            'SELECT * FROM Registrations WHERE EventID = ? AND EntryOTP = ?',
            [eventId, otp]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invalid OTP or Event.' });
        }

        const registration = rows[0];

        if (registration.OTPUsed) {
            return res.status(400).json({
                message: 'OTP Already Used!',
                details: {
                    studentName: registration.StudentName,
                    rollNumber: registration.RollNumber,
                    teamName: registration.TeamName,
                    usedAt: 'Previously'
                }
            });
        }

        // Mark as used
        await require('../config/db').execute(
            'UPDATE Registrations SET OTPUsed = TRUE WHERE RegistrationID = ?',
            [registration.RegistrationID]
        );

        res.json({
            message: 'Successful OTP! Access Granted.',
            details: {
                studentName: registration.StudentName,
                rollNumber: registration.RollNumber,
                teamName: registration.TeamName,
                branch: registration.Branch
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};
