const db = require("../config/db");
require("dotenv").config();



//รายงานที่ 1

const getReport1 = async (req, res) => {
  try {
    const { startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE maintenancerequests.mainr_Stat_ID NOT IN ('STC000007', 'STC000008')";
    if (startDate && endDate) {
      whereClause += ` AND mainr_Date BETWEEN ? AND ?`;
    }

    if (search) {
      whereClause += ` AND (
        mainr_ProblemTitle LIKE ? OR 
        users.user_Fname LIKE ? OR 
        users.user_Lname LIKE ? OR 
        stacase.StaCase_Name LIKE ? OR
        room.room_Number LIKE ? OR
        mainr_ID LIKE ? OR
        petitiontype.Type LIKE ? OR
        CONCAT(users.user_Fname, ' ', users.user_Lname) LIKE ?
      )`;
    }

    const query = `
      SELECT
        mainr_ID,
        CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
        room.room_Number AS roomNumber,
        mainr_ProblemTitle,
        mainr_Date,
        mainr_SuccessDate,
        petitiontype.Type AS petitionType,
        stacase.StaCase_Name AS status,
        mainr_Stat_ID AS status_ID
      FROM 
        maintenancerequests
      INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
      INNER JOIN users ON users.user_ID = renting.renting_user_ID
      INNER JOIN petitiontype ON petitiontype.ID = maintenancerequests.mainr_pattyp_ID
      INNER JOIN stacase ON stacase.StaCase_ID = maintenancerequests.mainr_Stat_ID
      INNER JOIN room ON room.room_ID = renting.renting_room_ID
      ${whereClause}
      ORDER BY maintenancerequests.mainr_ID ASC
      LIMIT ? OFFSET ?
    `;

    const params = [];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }
    if (search) {
      const searchTerm = `%${search}%`; 
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    params.push(Number(limit), offset);

    const [result] = await db.promise().query(query, params);

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM maintenancerequests
      INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
      INNER JOIN users ON users.user_ID = renting.renting_user_ID
      WHERE maintenancerequests.mainr_Stat_ID NOT IN ('STC000007', 'STC000008')
    `;
    const [[countResult]] = await db.promise().query(countQuery);
    const totalCount = countResult.totalCount;

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: result.map(item => ({
        ...item,
        mainr_Date: new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) + " " + new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mainr_SuccessDate: item.mainr_SuccessDate && !isNaN(new Date(item.mainr_SuccessDate).getTime())
          ? new Date(item.mainr_SuccessDate).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) + " " + new Date(item.mainr_SuccessDate).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "ยังซ่อมไม่เสร็จ"
      })),
      pagination: {
        currentPage: Number(page),
        totalPages,
        total: totalCount
      }
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const fetchChartData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        s.StaCase_Name AS status,
        COUNT(m.mainr_ID) AS count
      FROM maintenancerequests m
      JOIN stacase s ON m.mainr_Stat_ID = s.StaCase_ID
      WHERE m.mainr_Stat_ID NOT IN ('STC000007', 'STC000008')
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ` AND m.mainr_Date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` GROUP BY s.StaCase_Name ORDER BY count DESC`;
    
    const [results] = await db.promise().query(query, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล"
      });
    }

    const chartData = {
      labels: results.map(item => item.status),
      datasets: [{
        label: 'จำนวนการแจ้งซ่อม',
        data: results.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    let message = "ข้อมูลทั้งหมด";
    if (startDate && endDate) {
      message = `ข้อมูลระหว่างวันที่ ${startDate} ถึง ${endDate}`;
    }

    res.status(200).json({
      success: true,
      data: chartData,
      message: message
    });

  } catch (error) {
    console.error("Error in fetchChartData:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
      error: error.message
    });
  }
};


//รายงานที่ 2

const getReport2 = async (req, res) => {
  try {
    const { startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE maintenancerequests.mainr_Stat_ID NOT IN ('STC000007', 'STC000008', 'STC000006')";
    if (startDate && endDate) {
      whereClause += ` AND mainr_Date BETWEEN ? AND ?`;
    }

    if (search) {
      whereClause += ` AND (
        mainr_ProblemTitle LIKE ? OR 
        users.user_Fname LIKE ? OR 
        users.user_Lname LIKE ? OR 
        stacase.StaCase_Name LIKE ? OR
        room.room_Number LIKE ? OR
        mainr_ID LIKE ? OR
        petitiontype.Type LIKE ? OR
        CONCAT(users.user_Fname, ' ', users.user_Lname) LIKE ?
      )`;
    }

    const query = `
      SELECT
        mainr_ID,
        CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
        room.room_Number AS roomNumber,
        mainr_ProblemTitle,
        mainr_Date,
        mainr_SuccessDate,
        petitiontype.Type AS petitionType,
        stacase.StaCase_Name AS status,
        mainr_Stat_ID AS status_ID
      FROM 
        maintenancerequests
      INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
      INNER JOIN users ON users.user_ID = renting.renting_user_ID
      INNER JOIN petitiontype ON petitiontype.ID = maintenancerequests.mainr_pattyp_ID
      INNER JOIN stacase ON stacase.StaCase_ID = maintenancerequests.mainr_Stat_ID
      INNER JOIN room ON room.room_ID = renting.renting_room_ID
      ${whereClause}
      ORDER BY maintenancerequests.mainr_ID ASC
      LIMIT ? OFFSET ?
    `;

    const params = [];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }
    if (search) {
      const searchTerm = `%${search}%`; 
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    params.push(Number(limit), offset);

    const [result] = await db.promise().query(query, params);

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM maintenancerequests
      INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
      INNER JOIN users ON users.user_ID = renting.renting_user_ID
      WHERE maintenancerequests.mainr_Stat_ID NOT IN ('STC000007', 'STC000008')
    `;
    const [[countResult]] = await db.promise().query(countQuery);
    const totalCount = countResult.totalCount;

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: result.map(item => ({
        ...item,
        mainr_Date: new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) + " " + new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mainr_SuccessDate: item.mainr_SuccessDate && !isNaN(new Date(item.mainr_SuccessDate).getTime())
          ? new Date(item.mainr_SuccessDate).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) + " " + new Date(item.mainr_SuccessDate).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "ยังซ่อมไม่เสร็จ"
      })),
      pagination: {
        currentPage: Number(page),
        totalPages,
        total: totalCount
      }
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const fetchChartData2 = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        s.StaCase_Name AS status,
        COUNT(m.mainr_ID) AS count
      FROM maintenancerequests m
      JOIN stacase s ON m.mainr_Stat_ID = s.StaCase_ID
      WHERE m.mainr_Stat_ID NOT IN ('STC000007', 'STC000008', 'STC000006')
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ` AND m.mainr_Date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` GROUP BY s.StaCase_Name ORDER BY count DESC`;
    
    const [results] = await db.promise().query(query, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล"
      });
    }

    const chartData = {
      labels: results.map(item => item.status),
      datasets: [{
        label: 'จำนวนการแจ้งซ่อม',
        data: results.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    let message = "ข้อมูลทั้งหมด";
    if (startDate && endDate) {
      message = `ข้อมูลระหว่างวันที่ ${startDate} ถึง ${endDate}`;
    }

    res.status(200).json({
      success: true,
      data: chartData,
      message: message
    });

  } catch (error) {
    console.error("Error in fetchChartData:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
      error: error.message
    });
  }
};


//รายงานที่ 3

const getReport3 = async (req, res) => {
  try {
    const { startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE orderlist.status NOT IN ('SOD000010')";
    if (startDate && endDate) {
      whereClause += ` AND orders.date BETWEEN ? AND ?`;
    }

    if (search) {
      whereClause += ` AND (
        orderlist_orders_ID LIKE ? OR
        stockname LIKE ? OR
        staorder.StaOrder_Name LIKE ?
      )`;
    }

    const query = `
    SELECT 
      number,
        orderlist_orders_ID,
        orderlist_stock_ID,
        stockname,
        quantity,
        unit,
        price,
        totalprice,
        orderlist_type_stock,
        staorder.StaOrder_Name AS status,
        orders.date AS orderDate,
        approve_date
    FROM orderlist
        INNER JOIN staorder on staorder.StaOrder_ID = orderlist.status
        INNER JOIN orders on orderlist.orderlist_orders_ID = orders.order_ID
      ${whereClause}
      ORDER BY orderlist.orderlist_orders_ID ASC
      LIMIT ? OFFSET ?
    `;

    const params = [];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }
    if (search) {
      const searchTerm = `%${search}%`; 
      params.push(searchTerm,searchTerm,searchTerm);
    }
    params.push(Number(limit), offset);

    const [result] = await db.promise().query(query, params);

    const countQuery = `
    SELECT 
      COUNT(*) AS totalCount
    FROM orderlist
    `;
    const [[countResult]] = await db.promise().query(countQuery);
    const totalCount = countResult.totalCount;

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: result.map(item => ({
        ...item,
        orderDate: new Date(item.orderDate).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) ,
        approve_date: item.approve_date && !isNaN(new Date(item.approve_date).getTime())
          ? new Date(item.approve_date).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) + " " + new Date(item.approve_date).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "ยังไม่อนุมัติ"
      })),
      pagination: {
        currentPage: Number(page),
        totalPages,
        total: totalCount
      }
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const fetchChartData3 = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
    SELECT 
        s.StaOrder_Name AS status,
        COUNT(o.orderlist_orders_ID) AS count
    FROM orderlist o
    JOIN staorder s ON o.status = s.StaOrder_ID
    INNER JOIN orders ON orders.order_ID = o.orderlist_orders_ID
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ` WHERE orders.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` GROUP BY s.StaOrder_Name ORDER BY count DESC`;
    
    const [results] = await db.promise().query(query, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล"
      });
    }

    const chartData = {
      labels: results.map(item => item.status),
      datasets: [{
        label: 'จำนวนการแจ้งซ่อม',
        data: results.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    let message = "ข้อมูลทั้งหมด";
    if (startDate && endDate) {
      message = `ข้อมูลระหว่างวันที่ ${startDate} ถึง ${endDate}`;
    }

    res.status(200).json({
      success: true,
      data: chartData,
      message: message
    });

  } catch (error) {
    console.error("Error in fetchChartData:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
      error: error.message
    });
  }
};



//รายงานที่ 4

const getReport4 = async (req, res) => {
  try {
    const { startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE requisition_list.reqlist_stat_ID NOT IN ('SRQ000010')";
    if (startDate && endDate) {
      whereClause += ` AND requisition_Date BETWEEN ? AND ?`;
    }

    if (search) {
      whereClause += ` AND (
        reqlist_requisition_ID LIKE ?
      )`;
    }

    const query = `
      SELECT 
          reqlist_requisition_ID,
          requisition_Date,
          stock.name AS stockname,
          requisition_list.quantity AS quantity,
          unit.name AS unit,
          CASE 
            WHEN stareq.StaReq_ID IS NOT NULL THEN stareq.StaReq_Name
            WHEN staorder.StaOrder_ID IS NOT NULL THEN staorder.StaOrder_Name
            ELSE 'Unknown'
          END AS status,
          CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname
      FROM requisition_list
        INNER JOIN requisition ON requisition.requisition_ID = requisition_list.reqlist_requisition_ID
        INNER JOIN stock ON stock.ID = requisition_list.reqlist_stock_ID
        INNER JOIN unit ON unit.ID = stock.stock_unit_ID
        INNER JOIN users ON users.user_ID = requisition.requisition_user_ID
        LEFT JOIN stareq ON stareq.StaReq_ID = requisition_list.reqlist_stat_ID
        LEFT JOIN staorder ON staorder.StaOrder_ID = requisition_list.reqlist_stat_ID
        ${whereClause}
        ORDER BY reqlist_requisition_ID ASC
        LIMIT ? OFFSET ?
`;

    const params = [];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }
    if (search) {
      const searchTerm = `%${search}%`; 
      params.push(searchTerm);
    }
    params.push(Number(limit), offset);

    const [result] = await db.promise().query(query, params);

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM requisition_list
    `;
    const [[countResult]] = await db.promise().query(countQuery);
    const totalCount = countResult.totalCount;

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: result.map(item => ({
        ...item,
        requisition_Date: new Date(item.requisition_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      })),
      pagination: {
        currentPage: Number(page),
        totalPages,
        total: totalCount
      }
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const fetchChartData4 = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
    SELECT 
      COALESCE(s.StaReq_Name, o.StaOrder_Name) AS status,
      COUNT(r.reqlist_requisition_ID) AS count
    FROM requisition_list r
      LEFT JOIN stareq s ON r.reqlist_stat_ID = s.StaReq_ID
      LEFT JOIN staorder o ON r.reqlist_stat_ID = o.StaOrder_ID
      INNER JOIN requisition req ON req.requisition_ID = r.reqlist_requisition_ID
    `;

    const params = [];

    if (startDate && endDate) {
      query += ` WHERE req.requisition_Date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += `
    GROUP BY COALESCE(s.StaReq_Name, o.StaOrder_Name)
    ORDER BY count DESC;
    `;
        
    
    const [results] = await db.promise().query(query, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล"
      });
    }

    const chartData = {
      labels: results.map(item => item.status),
      datasets: [{
        label: 'จำนวนการแจ้งซ่อม',
        data: results.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    let message = "ข้อมูลทั้งหมด";
    if (startDate && endDate) {
      message = `ข้อมูลระหว่างวันที่ ${startDate} ถึง ${endDate}`;
    }

    res.status(200).json({
      success: true,
      data: chartData,
      message: message
    });

  } catch (error) {
    console.error("Error in fetchChartData:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
      error: error.message
    });
  }
};

//รายงานที่ 5

const getReport5 = async (req, res) => {
  try {
    const { startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE order_stat_ID IN ('SOD000006')";
    if (startDate && endDate) {
      whereClause += ` AND date BETWEEN ? AND ?`;
    }

    if (search) {
      whereClause += ` AND (
        order_ID LIKE ? 
      )`;
    }

    const query = `
      SELECT 
        order_ID,
        order_user_ID,
        total,
        date,
        approve_date,
        staorder.StaOrder_Name AS status,
        CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname
      FROM orders
        INNER JOIN staorder ON staorder.StaOrder_ID = order_stat_ID
        INNER JOIN users ON users.user_ID = orders.order_user_ID
      ${whereClause}
      ORDER BY order_ID ASC
      LIMIT ? OFFSET ?
    `;

    const params = [];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }
    if (search) {
      const searchTerm = `%${search}%`; 
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    params.push(Number(limit), offset);

    const [result] = await db.promise().query(query, params);

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM orders
      WHERE orders.order_stat_ID IN ('SOD000006')
    `;
    const [[countResult]] = await db.promise().query(countQuery);
    const totalCount = countResult.totalCount;

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: result.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        approve_date: item.approve_date && !isNaN(new Date(item.approve_date).getTime())
          ? new Date(item.approve_date).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "ยังซ่อมไม่เสร็จ"
      })),
      pagination: {
        currentPage: Number(page),
        totalPages,
        total: totalCount
      }
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const fetchChartData5 = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
    SELECT 
      o.date AS status,
      SUM(o.total) AS count
    FROM orders o
      JOIN staorder s ON o.order_stat_ID = s.StaOrder_ID
    WHERE o.order_stat_ID IN ('SOD000006')
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ` AND o.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` GROUP BY o.date ORDER BY count DESC`;

    const [results] = await db.promise().query(query, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล"
      });
    }

    // Format dates for display
    const formattedResults = results.map(item => ({
      ...item,
      formattedDate: new Date(item.status).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));

    const chartData = {
      labels: formattedResults.map(item => item.formattedDate),
      datasets: [{
        label: 'ราคารวม',
        data: formattedResults.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    let message = "ข้อมูลทั้งหมด";
    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate).toLocaleDateString("th-TH");
      const formattedEndDate = new Date(endDate).toLocaleDateString("th-TH");
      message = `ข้อมูลระหว่างวันที่ ${formattedStartDate} ถึง ${formattedEndDate}`;
    }

    res.status(200).json({
      success: true,
      data: chartData,
      rawData: formattedResults, // Optional: include raw data if needed
      message: message
    });

  } catch (error) {
    console.error("Error in fetchChartData5:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
      error: error.message
    });
  }
};


module.exports = { 
  getReport1, 
  fetchChartData,
  getReport2, 
  fetchChartData2,
  getReport3, 
  fetchChartData3,
  getReport4, 
  fetchChartData4,
  getReport5, 
  fetchChartData5,
};