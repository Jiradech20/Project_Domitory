const db = require("../config/db");
require("dotenv").config();

////////////////////USER///////////////////////////

const getInprogressCount = async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }

    const query = `
    SELECT 
    COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID IN ("STC000001","STC000002","STC000003","STC000005","STC000009") THEN 1 END) AS InprogressCount,
    COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID IN ("STC000004") THEN 1 END) AS ScheduledCount,
    COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID = "STC000006" THEN 1 END) AS CompletedCount,
    COUNT(*) AS TotalCount
    FROM 
      maintenancerequests
    INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
    WHERE 
      renting.renting_user_ID = ?
    `;

    const [result] = await db.promise().query(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }

    const data = result[0];
    const { InprogressCount, ScheduledCount, CompletedCount, TotalCount } = data;

    const inprogressPercent = TotalCount ? (InprogressCount / TotalCount) * 100 : 0;
    const scheduledPercent = TotalCount ? (ScheduledCount / TotalCount) * 100 : 0;
    const completedPercent = TotalCount ? (CompletedCount / TotalCount) * 100 : 0;

    res.status(200).json({
      InprogressCount,
      ScheduledCount,
      CompletedCount,
      TotalCount,
      inprogressPercent: inprogressPercent.toFixed(2), // ให้เป็นทศนิยม 2 ตำแหน่ง
      scheduledPercent: scheduledPercent.toFixed(2),
      completedPercent: completedPercent.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};


const getreqTimeLine= async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }

    const query = `
    SELECT 
    maintenancerequests.mainr_Date AS date
    FROM 
      maintenancerequests
    INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
    WHERE 
      renting.renting_user_ID = ?
    `;

    const [result] = await db.promise().query(query, [userId]);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};
///////////////////ForMac/////////////////////////
const getInprogressCountforMec = async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }
    const query = `
    SELECT 
    COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID IN ("STC000004") THEN 1 END) AS ScheduledCount,
    COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID = "STC000006" THEN 1 END) AS CompletedCount,
    COUNT(*) AS TotalCount
    FROM 
      maintenancerequests
    INNER JOIN schedulerepairs ON schedulerepairs.sdr_mainr_ID = maintenancerequests.mainr_ID
    INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID
    WHERE 
      scheculerepairsn_list.srl_user_ID = ?;
    `;
    const [result] = await db.promise().query(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }
    const data = result[0];
    const { ScheduledCount, CompletedCount, TotalCount } = data;
    const scheduledPercent = TotalCount ? (ScheduledCount / TotalCount) * 100 : 0;
    const completedPercent = TotalCount ? (CompletedCount / TotalCount) * 100 : 0;

    res.status(200).json({
      ScheduledCount,
      CompletedCount,
      TotalCount,
      scheduledPercent: scheduledPercent.toFixed(2),
      completedPercent: completedPercent.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getreqTimeLineMac = async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }
    const query = `
    SELECT 
    maintenancerequests.mainr_Date AS date
    FROM 
      maintenancerequests
    INNER JOIN schedulerepairs ON schedulerepairs.sdr_mainr_ID = maintenancerequests.mainr_ID
    INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID
    WHERE 
      scheculerepairsn_list.srl_user_ID = ?;
    `;
    const [result] = await db.promise().query(query, [userId]);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getInprogressCountAll = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID = "STC000002" THEN 1 END) AS CountA,
        COUNT(*) AS TotalCount
      FROM 
        maintenancerequests
    `;
    const [result] = await db.promise().query(query);
    const data = result[0];
    const { CountA, TotalCount } = data;
    const Count = TotalCount ? (CountA / TotalCount) * 100 : 0;
    res.status(200).json({
      CountA,
      TotalCount,
      Count: Count.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

///////////////////ForManager/////////////////////

const getInprogressCountManagerAll = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN orders.order_stat_ID = "SOD000002" THEN 1 END) AS CountA,
        COUNT(*) AS TotalCount
      FROM 
        orders
    `;
    const [result] = await db.promise().query(query);
    const data = result[0];
    const { CountA, TotalCount } = data;
    const Count = TotalCount ? (CountA / TotalCount) * 100 : 0;
    res.status(200).json({
      CountA,
      TotalCount,
      Count: Count.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getInprogressCountforManager = async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }
    const query = `
    SELECT 
        COUNT(CASE WHEN orders.order_stat_ID IN ("SOD000003", "SOD000004", "SOD000005","SOD000006") THEN 1 END) AS CommitCount,
        COUNT(CASE WHEN orders.order_stat_ID = "SOD000006" THEN 1 END) AS CompletedCount,
        COUNT(*) AS TotalCount
    FROM 
        orders
    `;
    const [result] = await db.promise().query(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }
    const data = result[0];
    const { CommitCount, CompletedCount, TotalCount} = data;
    const CommitCountPercent = TotalCount ? (CommitCount / TotalCount) * 100 : 0;
    const CompletedCountPercent = TotalCount ? (CompletedCount / TotalCount) * 100 : 0;
    
    res.status(200).json({
      CommitCount,
      CompletedCount,
      TotalCount,
      CommitCountPercent: CommitCountPercent.toFixed(2),
      CompletedCountPercent: CompletedCountPercent.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getreqTimeLineManager = async (req, res) => {
  try {
    const query = `
    SELECT 
    orders.approve_date AS date
    FROM 
      orders
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

///////////////////ForNiti/////////////////////
const getInprogressCountReqForNiti = async (req, res) => {
  try {
    const query = `
    SELECT 
        COUNT(CASE WHEN requisition.requisition_stat_ID = "SRQ000002" THEN 1 END) AS WaitCommitCount,
        COUNT(CASE WHEN requisition.requisition_stat_ID = "SRQ000001" THEN 1 END) AS WaitRqCount,
        COUNT(CASE WHEN requisition.requisition_stat_ID = "SRQ000003" THEN 1 END) AS CompleteCount,
        COUNT(CASE WHEN requisition.requisition_stat_ID = "SRQ000004" THEN 1 END) AS CancelCount, 
        COUNT(*) AS TotalCount
    FROM 
        requisition
    `;
    const [result] = await db.promise().query(query);
    const data = result[0];
    const { WaitCommitCount,WaitRqCount, CompleteCount,CancelCount,TotalCount } = data;
    const WaitCommitCountPercent = TotalCount ? (WaitCommitCount / TotalCount) * 100 : 0;
    const WaitRqCountPercent = TotalCount ? (WaitRqCount / TotalCount) * 100 : 0;
    const CompleteCountPercent = TotalCount ? (CompleteCount / TotalCount) * 100 : 0;
    const CancelCountPercent = TotalCount ? (CancelCount / TotalCount) * 100 : 0;
    res.status(200).json({
      WaitCommitCount,
      WaitRqCount,
      CompleteCount,
      CancelCount,
      TotalCount,
      WaitCommitCountPercent: WaitCommitCountPercent.toFixed(2),
      WaitRqCountPercent: WaitRqCountPercent.toFixed(2),
      CompleteCountPercent: CompleteCountPercent.toFixed(2),
      CancelCountPercent: CancelCountPercent.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getInprogressCountMainforNiti = async (req, res) => {
  try {
    const query = `
    SELECT 
      COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID IN ("STC000002","STC000004","STC000005","STC000009","STC0000010") THEN 1 END) AS InprogressCount,
      COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID = "STC000001" THEN 1 END) AS WaitcheckCount,
      COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID = "STC000003" THEN 1 END) AS ScheduleCount,
      COUNT(CASE WHEN maintenancerequests.mainr_Stat_ID = "STC000006" THEN 1 END) AS CompletedCount,
      COUNT(*) AS TotalCount
    FROM 
      maintenancerequests
    `;
    const [result] = await db.promise().query(query);

    if (result.length === 0) {
      console.error("เกิดข้อผิดพลาด:", err);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
    }
    const data = result[0];
    const { InprogressCount,WaitcheckCount, ScheduleCount, CompletedCount,TotalCount} = data;
    const InprogressCountPercent = TotalCount ? (InprogressCount / TotalCount) * 100 : 0;
    const ScheduleCountPercent = TotalCount ? (ScheduleCount / TotalCount) * 100 : 0;
    const CompletedCountPercent = TotalCount ? (CompletedCount / TotalCount) * 100 : 0;
    const WaitcheckCountPercent = TotalCount ? (WaitcheckCount / TotalCount) * 100 : 0;

    res.status(200).json({
      InprogressCount,
      WaitcheckCount,
      ScheduleCount,
      CompletedCount,
      TotalCount,
      InprogressCountPercent: InprogressCountPercent.toFixed(2),
      ScheduleCountPercent: ScheduleCountPercent.toFixed(2),
      CompletedCountPercent: CompletedCountPercent.toFixed(2),
      WaitcheckCountPercent: WaitcheckCountPercent.toFixed(2),
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getCouteLowStock = async (req, res) => {
  try {
    const query = `
    SELECT 
      stock.ID,
      stock.name, 
      stock.quantity,
      stock.stock_unit_ID,
      unit.name as unit
    FROM 
      stock
    JOIN unit on unit.ID = stock.stock_unit_ID
    WHERE quantity < 5;
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

module.exports = { 
  getInprogressCount, 
  getreqTimeLine, 
  getInprogressCountforMec, 
  getInprogressCountAll ,
  getreqTimeLineMac,
  getInprogressCountManagerAll,
  getInprogressCountforManager,
  getreqTimeLineManager,
  getInprogressCountReqForNiti,
  getInprogressCountMainforNiti,
  getCouteLowStock
};
