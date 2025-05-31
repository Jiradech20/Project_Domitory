const db = require("../config/db");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

//ดึงข้อมูลวันนัดวันซ่อม
const getreqtime = async (req, res) => {
  try {
    const query = `SELECT 
      schedulerepairs.ID as schedulerepairsID,
      schedulerepairs.Date AS Date,
      schedulerepairs.startTime AS startTime,
      schedulerepairs.endTime AS endTime,
      sdr_mainr_ID,
      room.room_Number AS room,
      GROUP_CONCAT(users.user_Fname, ' ', users.user_Lname) AS technicians
    FROM  
      schedulerepairs
      INNER JOIN maintenancerequests on maintenancerequests.mainr_ID = schedulerepairs.sdr_mainr_ID
      INNER JOIN stacase ms on ms.StaCase_ID = maintenancerequests.mainr_Stat_ID
      INNER JOIN renting on renting.renting_ID = maintenancerequests.mainr_renting_ID
      INNER JOIN room on room.room_ID = renting.renting_room_ID
      INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID
      INNER JOIN users ON users.user_ID = scheculerepairsn_list.srl_user_ID
    GROUP BY schedulerepairs.ID`;

    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    // ฟอร์แมตข้อมูลวันที่และเวลา (จัดการ timezone)
    const formattedResult = result.map((item) => {
      const date = new Date(item.Date);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

      const formattedDate = date.toISOString().split("T")[0]; // แปลงเป็น YYYY-MM-DD
      const formattedStartTime = item.startTime.slice(0, 5); // ตัดให้เหลือเฉพาะ HH:mm
      const formattedEndTime = item.endTime.slice(0, 5); // ตัดให้เหลือเฉพาะ HH:mm

      return {
        ...item,
        Date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        technicians: item.technicians ? item.technicians.split(",") : [], // แปลง technicians string เป็น array
      };
    });

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getMacForShc = async (req, res) => {
  try {
    const query = `SELECT 
    user_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname
  FROM 
    users
  WHERE
    user_Role_ID = "ROL000003"
      AND user_Status_ID = "STU000001"`;

    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};
//จะส่งกลับมาแค่ ช่างที่ไม่ได้ลา และไม่ได้หยุดประจำวันนั้นๆ
const getMacForShcTime = async (req, res) => {
  try {
    const { startDate } = req.query;
    if (!startDate) {
      return res.status(400).json({ error: "กรุณาระบุ startDate" });
    }

    const dateObj = new Date(startDate);
    const weekdayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });  //แปลง startDate เป็นชื่อวันในสัปดาห์ (Monday, Tuesday, ...)
    //หา "ช่างที่ว่าง"  JOIN 1: ตรวจสอบว่า ไม่ได้ลา 
    //              JOIN 2: ตรวจสอบว่า ไม่มีวันหยุดประจำสัปดาห์ตรงกับวันนั้น
    const query = `
      SELECT 
        users.user_ID,
        CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname
      FROM users
      LEFT JOIN leave_requests lr  
        ON users.user_ID = lr.User_ID 
        AND ? BETWEEN lr.start_date AND lr.end_date
      LEFT JOIN weekly_holidays wh 
        ON users.user_ID = wh.user_ID 
        AND JSON_CONTAINS(wh.days_off, JSON_QUOTE(?)) -- ตรวจสอบว่าเป็นวันหยุดหรือไม่
      WHERE 
        users.user_Role_ID = "ROL000003"
        AND users.user_Status_ID = "STU000001"
        AND lr.User_ID IS NULL
        AND wh.user_ID IS NULL
    `;

    const [result] = await db.promise().query(query, [startDate, weekdayName]);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};
//ดึงข้อมูลงานช่าง
const getReqwaitForShc = async (req, res) => {
  try {

    const query = `
    SELECT
      mainr_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
      room.room_Number AS roomNumber,
      mainr_ProblemTitle,
      mainr_ProblemDescription,
      mainr_Date,
      petitiontype.Type AS Type,
      stacase.StaCase_Name AS status
    FROM 
      maintenancerequests
        INNER JOIN renting on renting.renting_ID = maintenancerequests.mainr_renting_ID
        INNER JOIN users on users.user_ID = renting.renting_user_ID
        INNER JOIN petitiontype on petitiontype.ID = mainr_pattyp_ID
        INNER JOIN stacase on stacase.StaCase_ID = maintenancerequests.mainr_Stat_ID
        INNER JOIN room on room.room_ID = renting.renting_room_ID
    WHERE
        maintenancerequests.mainr_Stat_ID = "STC000003"
    ORDER BY
      maintenancerequests.mainr_ID ASC
    `;
    //STA000013 = รอนัด
    const [result] = await db.promise().query(query,);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      mainr_Date:
        new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};
//เช็คตารางงานช่างห้ามลงวันเวลาตรงกัน
const checkScheduleConflict = async (technician, date, startTime, endTime) => {
  const query = `
    SELECT * FROM schedulerepairs
    INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID
    WHERE srl_user_ID = ? 
      AND Date = ? 
      AND (
        (startTime < ? AND endTime > ?) OR 
        (startTime >= ? AND startTime < ?) OR
        (endTime > ? AND endTime <= ?)
      )
  `;
  const [result] = await db.promise().query(query, [technician, date, endTime, startTime, startTime, endTime, startTime, endTime]);
  return result.length > 0; // คืนค่า true ถ้าพบว่ามีตารางทับซ้อน
};
// ปรับปรุงฟังก์ชัน assignWork
const assignWork = async (req, res) => {
  try {
    const { repairID, technician, assistants, date, startTime, endTime } = req.body;

    // ตรวจสอบความซ้ำซ้อนสำหรับช่างหลัก
    if (await checkScheduleConflict(technician, date, startTime, endTime)) {
      return res.status(400).json({ error: "เวลานัดหมายของช่างหลักทับซ้อนกับงานอื่น" });
    }

    // ตรวจสอบความซ้ำซ้อนสำหรับผู้ช่วยช่าง
    for (const assistant of assistants) {
      if (await checkScheduleConflict(assistant, date, startTime, endTime)) {
        return res.status(400).json({ error: `เวลานัดหมายของผู้ช่วยทับซ้อนกับงานอื่น` });
      }
    }

    // สร้าง scheduleID ใหม่
    const query = "SELECT ID FROM schedulerepairs ORDER BY ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId = result.length === 0 ? 0 : parseInt(result[0].ID.slice(-6)) || 0;
    const scheduleID = "SCH" + String(maxId + 1).padStart(6, "0");

    // เพิ่มข้อมูลการนัดหมายใน schedulerepairs
    const insertScheduleQuery = `
      INSERT INTO schedulerepairs (ID, Date, startTime, endTime, sdr_mainr_ID)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.promise().query(insertScheduleQuery, [scheduleID, date, startTime, endTime, repairID]);

    // บันทึกช่างหลักและผู้ช่วยใน scheculerepairsn_list
    const insertTechnicianQuery = `
      INSERT INTO scheculerepairsn_list (Order_MN, srl_sdr_ID, srl_user_ID)
      VALUES (?, ?, ?)
    `;
    await db.promise().query(insertTechnicianQuery, [1, scheduleID, technician]);

    for (let i = 0; i < assistants.length; i++) {
      await db.promise().query(insertTechnicianQuery, [i + 2, scheduleID, assistants[i]]);
    }

    const updateStatusQuery = `
      UPDATE maintenancerequests
      SET mainr_Stat_ID = 'STC000004'
      WHERE mainr_ID = ?
    `;
    await db.promise().query(updateStatusQuery, [repairID]);
    //STC000004 = รอซ่อม
    res.status(201).json({ message: "การมอบหมายงานสำเร็จ" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  }
};
// const getTechnicianAppointments = async (req, res) => {

//   const technicianID = req.query.technicianID;
//   if (!technicianID) {
//     return res.status(400).json({ error: "กรุณาระบุรหัสช่าง" });
//   }

//   try {
//     const query = `
//       SELECT Date, startTime, endTime 
//       FROM schedulerepairs 
//       INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID 
//       WHERE scheculerepairsn_list.srl_user_ID = ? 
//       ORDER BY Date, startTime;
//     `;
//     const [appointments] = await db.promise().query(query, [technicianID]);

//     // ฟอร์แมตข้อมูลให้อยู่ในรูปแบบที่ FullCalendar ต้องการ
//     const formattedAppointments = appointments.map((appointment) => {
//       const date = new Date(appointment.Date).toISOString().split("T")[0]; // แปลงวันที่ให้เป็นรูปแบบ YYYY-MM-DD
//       const start = `${date}T${appointment.startTime}`;
//       const end = `${date}T${appointment.endTime}`;
//       return {
//         title: "มีการนัดหมาย",
//         start,
//         end,
//         color: "#dc3545",
//       };
//     });
//     res.status(200).json(formattedAppointments);
//   } catch (err) {
//     console.error("เกิดข้อผิดพลาด:", err);
//     res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย" });
//   }
// };

//จะส่งข้อมูลของวันที่ช่างไม่ว่าง วันลา 
const getTechnicianAppointments = async (req, res) => {
  const technicianID = req.query.technicianID;
  if (!technicianID) {
    return res.status(400).json({ error: "กรุณาระบุรหัสช่าง" });
  }
  try {
    //รวมกันด้วย UNION และเรียงตาม event_date, start_time
    const query = `
      (SELECT 
          schedulerepairs.Date AS event_date, 
          schedulerepairs.startTime AS start_time, 
          schedulerepairs.endTime AS end_time,
          NULL AS leave_start_date, 
          NULL AS leave_end_date,
          'appointment' AS event_type
        FROM schedulerepairs 
        INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID 
        WHERE scheculerepairsn_list.srl_user_ID = ?)
      UNION
      (SELECT 
          leave_requests.start_date AS event_date, 
          '00:00:00' AS start_time, 
          '23:59:59' AS end_time,   
          leave_requests.start_date AS leave_start_date, 
          leave_requests.end_date AS leave_end_date,
          'leave' AS event_type
        FROM leave_requests         
        WHERE leave_requests.User_ID = ? AND LeaveRequest_Sta = "SLR000001")
      ORDER BY event_date, start_time;
    `;
    const [appointments] = await db.promise().query(query, [technicianID, technicianID]);
    // ฟอร์แมตข้อมูลให้อยู่ในรูปแบบที่ FullCalendar ต้องการ
    const formattedAppointments = appointments.map((appointment) => {
      let date = new Date(appointment.event_date);
      date.setDate(date.getDate() + 1); // เพิ่ม 1 วัน
      const formattedDate = date.toISOString().split("T")[0]; 
      const start = `${formattedDate}T${appointment.start_time}`;
      const end = `${formattedDate}T${appointment.end_time}`;
      // เช็คประเภทของเหตุการณ์
      if (appointment.event_type === "leave") {
        return {
          title: "วันลา",
          start,
          end,
          color: "#f0ad4e", // สีเหลืองสำหรับวันลา
        };
      } else {
        return {
          title: "มีการนัดหมาย",
          start,
          end,
          color: "#dc3545", // สีแดงสำหรับการนัดหมาย
        };
      }
    });
    res.status(200).json(formattedAppointments);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย" });
  }
};
//ดึงวันหยุดประจำสัปดาห์ของช่าง
const getTechnicianWeeklyHolidays = async (req, res) => {
  const technicianID = req.query.technicianID;
  if (!technicianID) {
    return res.status(400).json({ error: "กรุณาระบุรหัสช่าง" });
  }

  try {
    const [rows] = await db
      .promise()
      .query("SELECT days_off FROM weekly_holidays WHERE user_ID = ?", [technicianID]);

    if (rows.length === 0) {
      return res.status(200).json({ days_off: [] });
    }

    const days_off = JSON.parse(rows[0].days_off);
    res.status(200).json({ days_off });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลวันหยุดประจำสัปดาห์" });
  }
};

module.exports = { getreqtime,getMacForShc,getReqwaitForShc,assignWork,getTechnicianAppointments,getMacForShcTime,getTechnicianWeeklyHolidays };
