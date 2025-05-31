const db = require("../config/db");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

//ลงวันลา
const AddLeaveRequest = async (req, res) => {
  const { user_id, startDate, endDate } = req.body;
  try {
      const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      const [balanceResult] = await db.promise().query("SELECT remaining_leave_days FROM leave_balance WHERE user_id = ?", [user_id]);
      if (balanceResult.length === 0 || balanceResult[0].remaining_leave_days < totalDays) {
          return res.status(400).json({ error: "วันลาคงเหลือไม่พอ" });
      }
      // สร้าง LeaveRequest_ID
      const [result] = await db.promise().query("SELECT LeaveRequest_ID FROM leave_requests ORDER BY LeaveRequest_ID DESC LIMIT 1");
      const lastLeaveId = result.length === 0 ? 0 : parseInt(result[0].LeaveRequest_ID.slice(-6)) || 0;
      const leaveID = "LEV" + String(lastLeaveId + 1).padStart(6, "0");
      // ตรวจสอบว่ามีคำขอลาในช่วงเวลานี้หรือไม่
      const [leaveCheckResult] = await db.promise().query(
          `SELECT * FROM leave_requests WHERE User_ID = ? 
           AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?)) 
           AND LeaveRequest_Sta = "SLR000001"`, 
          [user_id, startDate, endDate, startDate, endDate]
      );
      if (leaveCheckResult.length > 0) {
          return res.status(400).json({ error: "มีคำขอลาในช่วงเวลานี้แล้ว" });
      }
      const LeaveRequest_Sta = 'SLR000001';
      await db.promise().query(
          `INSERT INTO leave_requests (LeaveRequest_ID, User_ID, start_date, end_date, total_days, LeaveRequest_Sta) 
           VALUES (?, ?, ?, ?, ?, ?)`, 
          [leaveID, user_id, startDate, endDate, totalDays, LeaveRequest_Sta]
      );
      await db.promise().query(
          `UPDATE leave_balance SET remaining_leave_days = remaining_leave_days - ? WHERE user_id = ?`, 
          [totalDays, user_id]
      );

      res.status(201).json({ message: "บันทึกวันลาเรียบร้อยแล้ว" });

  } catch (err) {
      console.error("เกิดข้อผิดพลาด:", err);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกวันลา" });
  }
};
//ดึงข้อมูลพนักงานทุกคน
const getUserForLeaveRe = async (req, res) => {
    try {
        const query = `
        SELECT 
            user_ID,
            CONCAT(user_Fname, ' ', user_Lname) AS fullname,
            user_Role_ID,
            roles.role_Name
        FROM users
        JOIN roles ON roles.role_ID = users.user_Role_ID
        WHERE users.user_Role_ID != 'ROL000002';    
        `;    
          const [result] = await db.promise().query(query);
          res.status(200).json(result);
        } catch (err) {
          console.error("เกิดข้อผิดพลาด:", err);
          res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
    };
//ดึงข้อมูลการลา
const getLeaveRe = async (req, res) => {
        try {
            const query = `
            SELECT 
                LeaveRequest_ID,
                leave_requests.User_ID,
                CONCAT(user_Fname, ' ', user_Lname) AS fullname,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                LeaveRequest_Sta
            FROM leave_requests
            JOIN users ON users.user_ID = leave_requests.User_ID
            WHERE LeaveRequest_Sta = 'SLR000001'
            `;             
            const [result] = await db.promise().query(query);
            res.status(200).json(result);
        } catch (err) {
            console.error("เกิดข้อผิดพลาด:", err);
            res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
    };
//คืนค่าข้อมูลการลา
const CancelLeave = async (req, res) => {
      const { leaveId } = req.query;  
      const LeaveRequest_Sta = "SLR000002";
      try {         
          const [leaveData] = await db.promise().query("SELECT user_id, total_days FROM leave_requests WHERE LeaveRequest_ID = ?", [leaveId]);
          if (leaveData.length === 0) {
              return res.status(400).json({ error: "ไม่พบคำขอลา" });
          } 
          const { user_id, total_days } = leaveData[0];
          const [result] = await db.promise().query(
              "UPDATE leave_requests SET LeaveRequest_Sta = ? WHERE LeaveRequest_ID = ?",
              [LeaveRequest_Sta, leaveId]
          );  
          if (result.affectedRows === 0) {
              return res.status(400).json({ error: "เกิดข้อผิดพลาดในการยกเลิก" });
          }
          await db.promise().query(
              "UPDATE leave_balance SET remaining_leave_days = remaining_leave_days + ? WHERE user_id = ?",
              [total_days, user_id]
          );
  
          res.status(200).json({ message: "ยกเลิกการลาสำเร็จ และคืนวันลาเรียบร้อย" }); 
      } catch (err) {
          console.error("เกิดข้อผิดพลาด:", err);
          res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
      }
    };  
//รีเซ็ตวันลาคงเหลือ
const resetleavedays = async () => {
    try {
      // รีเซ็ต remaining_leave_days เป็น 30
      await db.promise().query('UPDATE leave_balance SET remaining_leave_days = 30');
      // แสดงข้อความใน console
      console.log('รีเซ็ตวันลาคงเหลือเป็น 30 เรียบร้อยแล้ว!');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการรีเซ็ตวันลาคงเหลือ:', error);
    }
    };

//   const addleavebalance = async (req, res) => {
//     try {
//       await db.promise().query(`
//         INSERT INTO leave_balance (user_ID, total_leave_days, remaining_leave_days)
//         SELECT user_ID, 30, 30
//         FROM users
//         WHERE user_Role_ID IN ('ROL000002', 'ROL000003', 'ROL000004', 'ROL000005')
//         AND user_ID NOT IN (SELECT user_ID FROM leave_balance);
//       `);
//       res.status(200).send('เพิ่มข้อมูลวันลาของพนักงานเรียบร้อยแล้ว!');
//     } catch (error) {
//       console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลวันลา:', error);
//       res.status(500).send('เกิดข้อผิดพลาดในการเพิ่มข้อมูลวันลา');
//     }
//   };

// DELIMITER //

// CREATE TRIGGER after_user_insert
// AFTER INSERT ON users
// FOR EACH ROW
// BEGIN
//   -- เช็คว่า user_Role_ID เป็นหนึ่งในกลุ่มที่กำหนดหรือไม่
//   IF NEW.user_Role_ID IN ('ROL000002', 'ROL000003', 'ROL000004', 'ROL000005') THEN
//     -- ถ้าใช่, เพิ่มข้อมูลลงใน leave_balance
//     INSERT INTO leave_balance (user_ID, total_leave_days, remaining_leave_days)
//     VALUES (NEW.user_ID, 30, 30);
//   END IF;
// END//

// DELIMITER ;

  
  module.exports = {
    AddLeaveRequest,
    getUserForLeaveRe,
    getLeaveRe,
    CancelLeave,
    resetleavedays
  };