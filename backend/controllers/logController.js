const db = require("../config/db");
require("dotenv").config();




const logLogin = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        const userID = getUserID(token);
        if (!userID) {
            return res.status(401).json({ error: "Invalid token" });
        }

        let LogIDResponse = await AutoIDLog();
        let LogID = LogIDResponse[0][0].AutoID;
        console.log("Generated LogID ID:", LogID);

        const logLoginQuery = `
            INSERT INTO logs 
            (logs_ID, logs_Datein, logs_User_ID)
            VALUES (?, NOW(), ?)
        `;
        await db.promise().query(logLoginQuery, [LogID, userID]);
        await updateMaxID("log", LogID);
        
        return res.status(200).json({ 
            success: true, 
            logID: LogID 
          });
    } catch (error) {
        console.error("Error in logLogin:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const logLogOut = async (req, res) => {
    const { LogID } = req.body;
    try {
        const UpdatelogLoginQuery = `
            UPDATE logs
            SET logs_Dateout = NOW()
            WHERE logs_ID = ?
        `
        await db.promise().query(UpdatelogLoginQuery, [LogID]);        
        return res.status(200).json({ 
            success: true, 
            logID: LogID 
          });
    } catch (error) {
        console.error("Error in logLogOut:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const AutoIDLog = async () => {
    try {
      const query = 'CALL GenerateAutoID("log")';
      const [result] = await db.promise().query(query);
      return result;
    } catch (err) {
      console.error("เกิดข้อผิดพลาด:", err);
      throw new Error("เกิดข้อผิดพลาดในการดำเนินการ");
    }
  };

const updateMaxID = async (tableName, newMaxID) => {
    try {
      const query = `
        UPDATE maxid
        SET max_id = ?
        WHERE max_table = ?
      `;
      await db.promise().query(query, [newMaxID, tableName]);
    } catch (err) {
      console.error(`เกิดข้อผิดพลาดในการอัปเดต max_id สำหรับ ${tableName}:`, err);
      throw new Error(`ไม่สามารถอัปเดต max_id สำหรับ ${tableName}`);
    }
  };

const decodeJWTTH = (token) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid token format');
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const getUserID = (token) => {
    if (token) {
      const decodedPayload = decodeJWTTH(token);
      return decodedPayload?.id || '';
    }
    console.log('Token not found');
    return '';
  };

module.exports = { 
    logLogin,
    logLogOut,
};