<template>
  <div class="container mt-4 fluid">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>รายงานการสั่งซื้อวัสดุและอุปกรณ์ตามช่วงเวลา</h5>
        <div>
          <button class="btn btn-danger me-2" @click="exportPDF">
            <i class="fas fa-file-pdf"></i> Export PDF
          </button>
          <button class="btn btn-success" @click="exportExcel">
            <i class="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-3">
            <label class="form-label">วันที่เริ่มต้น</label>
            <input type="date" class="form-control" v-model="filters.startDate" />
          </div>
          <div class="col-md-3">
            <label class="form-label">วันที่สิ้นสุด</label>
            <input type="date" class="form-control" v-model="filters.endDate" />
          </div>
          <div class="col-md-4">
            <label class="form-label">ค้นหา</label>
            <input
              type="text"
              class="form-control"
              placeholder="ค้นหา..."
              v-model="filters.search"
            />
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-primary w-100" @click="fetchData">
              <i class="fas fa-search"></i> ค้นหา
            </button>
          </div>
        </div>

        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeTab === 'table' }"
              @click="activeTab = 'table'"
            >
              ตารางรายงาน
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeTab === 'chart' }"
              @click="handleChartTabClick"
            >
              กราฟแสดงผล
            </a>
          </li>
        </ul>

        <div v-if="activeTab === 'table'" class="tab-content mt-3">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อวัสดุ</th>
                  <th>จำนวน</th>
                  <th>หน่วย</th>
                  <th>ราคา</th>
                  <th>วันที่สั่ง</th>
                  <th>วันที่อนุมัติ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="reports.length === 0">
                  <td colspan="7" class="text-center text-muted">ไม่พบข้อมูล</td>
                </tr>
                <tr v-for="item in reports" :key="item.mainr_ID">
                  <td>{{ item.orderlist_orders_ID }}</td>
                  <td>{{ item.stockname }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.totalprice }}</td>
                  <td>{{ item.orderDate }}</td>
                  <td>{{ item.approve_date || "-" }}</td>
                  <td>
                    <span class="badge" :class="getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="col-md-1">
            <!-- <label class="form-label">แสดง</label> -->
            <select class="form-select" v-model="pagination.limit" @change="fetchData">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <nav v-if="pagination.totalPages > 1">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
                <button class="page-link" @click="changePage(pagination.currentPage - 1)">
                  &laquo;
                </button>
              </li>
              <li
                v-for="page in visiblePages"
                :key="page"
                class="page-item"
                :class="{ active: page === pagination.currentPage }"
              >
                <button class="page-link" @click="changePage(page)">
                  {{ page }}
                </button>
              </li>
              <li
                class="page-item"
                :class="{ disabled: pagination.currentPage === pagination.totalPages }"
              >
                <button class="page-link" @click="changePage(pagination.currentPage + 1)">
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div v-if="activeTab === 'chart'" class="tab-content mt-3">
          <div v-if="chartLoading" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else>
            <div class="alert alert-info mb-3">
              <i class="fas fa-info-circle me-2"></i>
              {{ chartInfoMessage }}
            </div>
            <div class="row mb-3">
              <div class="col-md-12">
                <h6 class="text-center">จำนวนการสั่งซื้อวัสดุและอุปกรณ์</h6>
                <div class="chart-container" style="height: 300px">
                  <canvas ref="barChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed, nextTick } from "vue";
import axios from "axios";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default {
  setup() {
    const reports = ref([]);
    const loading = ref(false);
    const chartLoading = ref(false);
    const activeTab = ref("table");
    const barChart = ref(null);
    const chartInstance = ref(null);
    const chartInfoMessage = ref("กรุณาเลือกช่วงวันที่เพื่อแสดงกราฟ");

    const filters = ref({
      search: "",
      startDate: "",
      endDate: "",
    });

    const pagination = ref({
      currentPage: 1,
      total: 0,
      totalPages: 1,
      limit: 10,
    });

    const fetchData = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.value.currentPage,
          limit: pagination.value.limit,
          search: filters.value.search,
          startDate: filters.value.startDate,
          endDate: filters.value.endDate,
        };

        const response = await axios.get("/api/auth/getReport3", { params });
        reports.value = response.data.data;
        pagination.value = response.data.pagination;
      } catch (error) {
        console.error("Error fetching reports:", error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        loading.value = false;
      }
    };

    const changePage = (page) => {
      if (page < 1 || page > pagination.value.totalPages) return;
      pagination.value.currentPage = page;
      fetchData();
    };

    const exportExcel = async () => {
      try {
        if (reports.value.length === 0) {
          alert("ไม่มีข้อมูลที่จะส่งออก");
          return;
        }

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        const excelData = reports.value.map((item) => ({
          รหัส: item.orderlist_orders_ID,
          ชื่อวัสดุ: item.stockname,
          จำนวน: item.quantity,
          หน่วย: item.unit,
          ราคา: item.totalprice,
          วันที่สั่ง: item.orderDate,
          วันที่อนุมัติ: item.approve_date || "-",
          สถานะ: item.status,
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;

        XLSX.utils.book_append_sheet(wb, ws, "การสั่งซื้อวัสดุและอุปกรณ์");

        const fileName = `การสั่งซื้อวัสดุและอุปกรณ์_${dateStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert("เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel");
      }
    };

    const exportPDF = async () => {
      try {
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
        });

        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
        const typeStr = activeTab.value === "table" ? "ตารางรายงาน" : "กราฟรายงาน";
        let fileName;
        if (filters.value.startDate && filters.value.endDate) {
          fileName = `${typeStr}_การสั่งซื้อวัสดุและอุปกรณ์_${dateStr}ตั้งแต่${formatDate(
            filters.value.startDate
          )}ถึง${formatDate(filters.value.endDate)}.pdf`;
        } else {
          fileName = `${typeStr}_การสั่งซื้อวัสดุและอุปกรณ์_${dateStr}.pdf`;
        }

        let element;
        if (activeTab.value === "table") {
          element = document.querySelector(".table-responsive");
          if (filters.value.startDate && filters.value.endDate) {
            doc.setFontSize(8);
            doc.text(
              `${formatDate(filters.value.startDate)} - ${formatDate(
                filters.value.endDate
              )}`,
              20,
              25,
              { align: "left" }
            );
          }
        } else {
          element = document.querySelector(".chart-container");
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            const elements = clonedDoc.querySelectorAll("*");
            elements.forEach((el) => {
              el.style.fontFamily = "'TH Sarabun New', sans-serif";
            });
          },
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = doc.internal.pageSize.getWidth() - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(
          imgData,
          "PNG",
          20,
          activeTab.value === "table" ? 30 : 20,
          imgWidth,
          imgHeight
        );

        doc.save(fileName);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
      }
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const getStatusClass = (status) => {
      switch (status) {
        case "รอดำเนินการ":
          return "bg-warning text-dark";
        case "กำลังดำเนินการ":
          return "bg-info text-white";
        case "ดำเนินการเสร็จสิ้น":
          return "bg-success text-white";
        case "ยกเลิก":
          return "bg-secondary text-white";
        default:
          return "bg-light text-dark";
      }
    };

    const visiblePages = computed(() => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, pagination.value.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(pagination.value.totalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    });

    const renderBarChart = (chartData) => {
      if (!barChart.value) {
        console.warn("Canvas element not ready");
        return;
      }

      const ctx = barChart.value.getContext("2d");
      if (chartInstance.value) {
        chartInstance.value.destroy();
      }

      const chartTitle =
        filters.value.startDate && filters.value.endDate
          ? `จำนวนการสั่งซื้อวัสดุและอุปกรณ์ (${filters.value.startDate} ถึง ${filters.value.endDate})`
          : "จำนวนการสั่งซื้อวัสดุและอุปกรณ์ทั้งหมด";

      chartInstance.value = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${context.raw} รายการ`;
                },
              },
            },
            title: {
              display: true,
              text: chartTitle,
              font: {
                size: 16,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0,
              },
              title: {
                display: true,
                text: "จำนวน",
              },
            },
            x: {
              title: {
                display: true,
                text: "สถานะ",
              },
            },
          },
          animation: {
            duration: 1000,
            easing: "easeInOutQuad",
          },
        },
      });
    };

    const fetchChartData = async () => {
      try {
        chartLoading.value = true;

        const response = await axios.get("/api/auth/fetchChartData3", {
          params: {
            startDate: filters.value.startDate || null,
            endDate: filters.value.endDate || null,
          },
        });

        if (response.data.success && response.data.data) {
          const chartData = {
            labels: response.data.data.labels,
            datasets: [
              {
                label: "จำนวนการการสั่งซื้อวัสดุและอุปกรณ์",
                data: response.data.data.datasets[0].data,
                backgroundColor: [
                  "rgba(255, 99, 132, 0.7)",
                  "rgba(54, 162, 235, 0.7)",
                  "rgba(255, 206, 86, 0.7)",
                  "rgba(75, 192, 192, 0.7)",
                  "rgba(153, 102, 255, 0.7)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                  "rgba(153, 102, 255, 1)",
                ],
                borderWidth: 1,
              },
            ],
          };

          renderBarChart(chartData);
          chartInfoMessage.value = response.data.message;
        } else {
          renderEmptyChart();
          chartInfoMessage.value = "ไม่พบข้อมูลในช่วงเวลาที่เลือก";
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        renderEmptyChart();
        chartInfoMessage.value = "เกิดข้อผิดพลาดในการโหลดข้อมูลกราฟ";
      } finally {
        chartLoading.value = false;
      }
    };

    const handleChartTabClick = async () => {
      activeTab.value = "chart";
      chartLoading.value = true;

      try {
        await nextTick();
        await fetchChartData();
      } catch (error) {
        console.error("Error in handleChartTabClick:", error);
        chartInfoMessage.value = "ไม่สามารถแสดงกราฟได้";
        renderEmptyChart();
      } finally {
        chartLoading.value = false;
      }
    };

    watch(
      [() => filters.value.startDate, () => filters.value.endDate],
      (newValues, oldValues) => {
        if (
          activeTab.value === "chart" &&
          (newValues[0] !== oldValues[0] || newValues[1] !== oldValues[1])
        ) {
          fetchChartData();
        }
      }
    );

    watch(
      () => filters.value.endDate,
      async () => {
        if (activeTab.value === "chart") {
          chartLoading.value = true;
          await fetchChartData();
        } else {
          activeTab.value = "table";
          await fetchData();
        }
      }
    );

    onMounted(() => {
      fetchData();
    });

    watch(
      [
        () => filters.value.search,
        () => filters.value.startDate,
        () => filters.value.endDate,
      ],
      () => {
        if (activeTab.value === "table") {
          pagination.value.currentPage = 1;
          fetchData();
        }
      },
      { deep: true }
    );

    watch(activeTab, async (newVal) => {
      if (newVal === "chart") {
        try {
          await handleChartTabClick();
        } catch (error) {
          console.error("Error in activeTab watch:", error);
        }
      }
    });

    return {
      reports,
      loading,
      chartLoading,
      activeTab,
      filters,
      pagination,
      barChart,
      chartInfoMessage,
      fetchData,
      fetchChartData,
      handleChartTabClick,
      changePage,
      visiblePages,
      exportExcel,
      exportPDF,
      getStatusClass,
    };
  },
};
</script>

<style scoped>
.table-responsive {
  max-height: 500px;
  overflow-y: auto;
}

.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  font-weight: bold;
  border-bottom: 3px solid #0d6efd;
  color: #0d6efd;
}

.badge {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 0.9em;
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 300px;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

@media print {
  body {
    background: white;
    color: black;
    font-family: "TH Sarabun New", sans-serif !important;
  }

  .table-responsive {
    overflow: visible !important;
    max-height: none !important;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-family: "TH Sarabun New", sans-serif !important;
  }

  .table th,
  .table td {
    border: 1px solid #ddd;
    padding: 8px;
    font-family: "TH Sarabun New", sans-serif !important;
  }

  .table th {
    background-color: #f2f2f2;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    font-family: "TH Sarabun New", sans-serif !important;
  }

  .chart-container canvas {
    max-width: 100%;
    height: auto !important;
    font-family: "TH Sarabun New", sans-serif !important;
  }

  @font-face {
    font-family: "TH Sarabun New";
    src: url("/fonts/THSarabunNew.ttf") format("truetype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  body {
    font-family: "TH Sarabun New", sans-serif;
  }
}
</style>
