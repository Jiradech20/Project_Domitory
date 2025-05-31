<template>
  <div>
    <ul class="nav nav-tabs">
      <li v-if="showTab1" class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === '1' }"
          @click.prevent="switchTab('1')"
          href="#"
        >
          Dashboard
        </a>
      </li>
      <li v-if="showTab2" class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === '2' }"
          @click.prevent="switchTab('2')"
          href="#"
        >
          Dashboard
        </a>
      </li>
      <li v-if="showTab3" class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === '3' }"
          @click.prevent="switchTab('3')"
          href="#"
        >
          Dashboard
        </a>
      </li>
      <li v-if="showTab4" class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === '4' }"
          @click.prevent="switchTab('4')"
          href="#"
        >
          Dashboard
        </a>
      </li>
    </ul>

    <div class="tab-content mt-3">
      <!--DashBoard ของผู้ใช้-->
      <div v-if="showTab1 && activeTab === '1'" class="tab-pane active">
        <CRow>
          <CCol :md="3">
            <CCard color="primary" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ items.InprogressCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่กำลังดำเนินการ</div>
                <small class="text-white-50">({{ items.inprogressPercent || 0 }}%)</small>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="info" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ items.ScheduledCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่นัดแล้ว</div>
                <small class="text-white-50">({{ items.scheduledPercent || 0 }}%)</small>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="warning" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ items.CompletedCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่เสร็จสิ้น</div>
                <small class="text-white-50">({{ items.completedPercent || 0 }}%)</small>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="danger" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ items.TotalCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมทั้งหมด</div>
                <small class="text-white-50">(100%)</small>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
        <CRow>
          <CCol :md="12">
            <CCard>
              <CCardBody>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h4 id="traffic" class="card-title mb-0">จำนวนการแจ้งซ่อม</h4>
                  </div>
                  <CButtonGroup class="float-end">
                    <CButton
                      color="secondary"
                      @click="setTimeRange('day')"
                      :active="timeRange === 'day'"
                      >วัน</CButton
                    >
                    <CButton
                      color="secondary"
                      @click="setTimeRange('month')"
                      :active="timeRange === 'month'"
                      >เดือน</CButton
                    >
                    <CButton
                      color="secondary"
                      @click="setTimeRange('year')"
                      :active="timeRange === 'year'"
                      >ปี</CButton
                    >
                  </CButtonGroup>
                </div>
                <CChartLine
                  :data="lineChartData"
                  :options="lineChartOptions"
                  style="height: 300px; max-height: 300px; margin-top: 20px"
                />
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
      <!--DashBoard ของนิติ-->
      <div v-if="showTab2 && activeTab === '2'" class="tab-pane active">
        <CRow>
          <CCol :md="3">
            <CCard color="primary" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsNiti.InprogressCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่รอตรวจสอบ</div>
                <small class="text-white-50"
                  >({{ itemsNiti.InprogressCount || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="info" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsNiti.ScheduleCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่รอนัด</div>
                <small class="text-white-50"
                  >({{ itemsNiti.ScheduleCountPercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="warning" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsNiti.CompletedCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่เสร็จสิ้น</div>
                <small class="text-white-50"
                  >({{ itemsNiti.CompletedCountPercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="danger" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsNiti.TotalCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมทั้งหมด</div>
                <small class="text-white-50">(100%)</small>
              </CCardBody>
            </CCard>
          </CCol>
          <CRow>
            <CCol :md="5">
              <CCard>
                <CCardBody>
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 id="traffic" class="card-title mb-0">
                        จำนวนการแจ้งเบิกอุปกรณ์
                      </h4>
                    </div>
                  </div>
                  <div style="height: 200px; width: 100%; padding: 20px">
                    <CChart
                      type="pie"
                      :data="PieChartDataNiti"
                      :options="PieChartOptionsPie"
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol :md="7">
              <CCard>
                <div class="low-stock-container">
                  <h2>อุปกรณ์ใกล้หมด</h2>
                  <div class="table-wrapper">
                    <table class="low-stock-table">
                      <thead>
                        <tr>
                          <th>รหัสอุปกรณ์</th>
                          <th>ชื่ออุปกรณ์</th>
                          <th>จำนวนคงเหลือ</th>
                          <th>หน่วยนับ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in lowStockItems" :key="item.ID">
                          <td>{{ item.ID }}</td>
                          <td>{{ item.name }}</td>
                          <td>{{ item.quantity }}</td>
                          <td>{{ item.unit }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CCard>
            </CCol>
          </CRow>
        </CRow>
      </div>
      <!--DashBoard ของช่าง-->
      <div v-if="showTab3 && activeTab === '3'" class="tab-pane active">
        <CRow>
          <!-- <CCol :md="12" class="text-center"> Dashboard ช่าง ---กำลังพัฒนา--- 
            <CButton
            color="primary"
            class="w-80"
            block
            style="margin: 100px"
            @click="$router.push('/macMgnReqView')"
            >ไปหน้าคำร้องขอแจ้งซ่อม</CButton
          >
          </CCol> -->
          <CCol :md="3">
            <CCard color="primary" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemscount.InprogressCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่รอประเมิน</div>
                <small class="text-white-50"
                  >({{ itemscount.InprogressCountpercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>
          <CCol :md="3">
            <CCard color="info" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsMac.ScheduledCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่นัดแล้ว</div>
                <small class="text-white-50"
                  >({{ itemsMac.scheduledPercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>
          <CCol :md="3">
            <CCard color="warning" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsMac.CompletedCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมที่เสร็จสิ้น</div>
                <small class="text-white-50"
                  >({{ itemsMac.completedPercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>
          <CCol :md="3">
            <CCard color="danger" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsMac.TotalCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมทั้งหมด</div>
                <small class="text-white-50">(100%)</small>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
        <CRow>
          <CCol :md="12">
            <CCard>
              <CCardBody>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h4 id="traffic1" class="card-title mb-0">จำนวนการแจ้งซ่อม</h4>
                  </div>
                  <CButtonGroup class="float-end">
                    <CButton
                      color="secondary"
                      @click="setTimeRange('day')"
                      :active="timeRange === 'day'"
                      >วัน</CButton
                    >
                    <CButton
                      color="secondary"
                      @click="setTimeRange('month')"
                      :active="timeRange === 'month'"
                      >เดือน</CButton
                    >
                    <CButton
                      color="secondary"
                      @click="setTimeRange('year')"
                      :active="timeRange === 'year'"
                      >ปี</CButton
                    >
                  </CButtonGroup>
                </div>
                <CChartLine
                  :data="lineChartDataMac"
                  :options="lineChartOptions"
                  style="height: 300px; max-height: 300px; margin-top: 20px"
                />
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
      <!--DashBoard ผู้จัดการ-->
      <div v-if="showTab4 && activeTab === '4'" class="tab-pane active">
        <CRow>
          <CCol :md="3">
            <CCard color="primary" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemscountManager.InprogressCount || 0 }}</div>
                <div>รายการใบสั่งซื้อที่ยังไม่อนุมัติ</div>
                <small class="text-white-50"
                  >({{ itemscountManager.InprogressCountpercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="info" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsManager.CommitCount || 0 }}</div>
                <div>รายการใบสั่งซื้อที่อนุมัติแล้ว</div>
                <small class="text-white-50"
                  >({{ itemsManager.CommitCountPercent || 0 }}%)</small
                >
              </CCardBody>
            </CCard>
          </CCol>

          <CCol :md="3">
            <CCard color="danger" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ itemsManager.TotalCount || 0 }}</div>
                <div>จำนวนรายการใบสั่งซื้อทั้งหมด</div>
                <small class="text-white-50">(100%)</small>
              </CCardBody>
            </CCard>
          </CCol>

          <!-- <CCol :md="3">
            <CCard color="danger" class="text-white mb-4">
              <CCardBody>
                <div class="text-value">{{ items.TotalCount || 0 }}</div>
                <div>จำนวนการแจ้งซ่อมทั้งหมด</div>
                <small class="text-white-50">(100%)</small>
              </CCardBody>
            </CCard>
          </CCol> -->
        </CRow>
        <CRow>
          <CCol :md="12">
            <CCard>
              <CCardBody>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h4 id="traffic" class="card-title mb-0">จำนวนใบสั่งซื้อทั้งหมด</h4>
                  </div>
                  <CButtonGroup class="float-end">
                    <CButton
                      color="secondary"
                      @click="setTimeRange('day')"
                      :active="timeRange === 'day'"
                      >วัน</CButton
                    >
                    <CButton
                      color="secondary"
                      @click="setTimeRange('month')"
                      :active="timeRange === 'month'"
                      >เดือน</CButton
                    >
                    <CButton
                      color="secondary"
                      @click="setTimeRange('year')"
                      :active="timeRange === 'year'"
                      >ปี</CButton
                    >
                  </CButtonGroup>
                </div>
                <CChartLine
                  :data="lineChartDataManager"
                  :options="lineChartOptions"
                  style="height: 300px; max-height: 300px; margin-top: 20px"
                />
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CButtonGroup,
  CButton,
  CCardFooter,
} from "@coreui/vue";
import { CChartLine } from "@coreui/vue-chartjs";
import axios from "axios";
import { nextTick } from "vue";
import { CChartPie } from "@coreui/vue-chartjs";
import { CChart } from "@coreui/vue-chartjs";

export default {
  name: "Dashboard",
  components: { CRow, CCol, CCard, CCardBody, CChartLine, CButtonGroup, CButton, CChart },
  setup() {
    const permissions = localStorage.getItem("permissions") || "0000000000000000";
    const showTab1 = permissions.charAt(2) === "1";
    const showTab2 = permissions.charAt(3) === "1";
    const showTab3 = permissions.charAt(4) === "1";
    const showTab4 = permissions.charAt(5) === "1";
    const activeTab = ref(null);
    const lowStockItems = ref([]);
    const itemscount = ref({
      InprogressCount: 0,
      InprogressCountpercent: 0,
    });
    const items = ref({
      InprogressCount: 0,
      ScheduledCount: 0,
      CompletedCount: 0,
      TotalCount: 0,
      inprogressPercent: 0,
      scheduledPercent: 0,
      completedPercent: 0,
    });

    //========Mac=========
    const itemsMac = ref({
      ScheduledCount: 0,
      CompletedCount: 0,
      TotalCount: 0,
      scheduledPercent: 0,
      completedPercent: 0,
    });
    //====================

    //======Manager=======
    const itemsManager = ref({
      CommitCount: 0,
      CompletedCount: 0,
      TotalCount: 0,
      CommitCountPercent: 0,
      CompletedCountPercent: 0,
    });
    const itemscountManager = ref({
      InprogressCount: 0,
      InprogressCountpercent: 0,
    });
    //====================

    //========Niti=========
    const itemsNiti = ref({
      InprogressCount: 0,
      WaitcheckCount: 0,
      ScheduleCount: 0,
      CompletedCount: 0,
      TotalCount: 0,
      InprogressCountPercent: 0,
      ScheduleCountPercent: 0,
      CompletedCountPercent: 0,
      WaitcheckCountPercent: 0,
    });
    //====================

    const timeRange = ref("month");
    const lineChartData = ref({
      labels: [],
      datasets: [
        {
          label: "จำนวนแจ้งซ่อม",
          backgroundColor: "rgba(0,123,255,0.1)",
          borderColor: "rgba(0,123,255,1)",
          pointBackgroundColor: "rgba(0,123,255,1)",
          pointBorderColor: "#fff",
          data: [],
        },
      ],
    });

    const lineChartDataMac = ref({
      labels: [],
      datasets: [
        {
          label: "จำนวนแจ้งซ่อม",
          backgroundColor: "rgba(0,123,255,0.1)",
          borderColor: "rgba(0,123,255,1)",
          pointBackgroundColor: "rgba(0,123,255,1)",
          pointBorderColor: "#fff",
          data: [],
        },
      ],
    });

    const lineChartDataManager = ref({
      labels: [],
      datasets: [
        {
          label: "จำนวนใบสั่งซื้อ",
          backgroundColor: "rgba(0,123,255,0.1)",
          borderColor: "rgba(0,123,255,1)",
          pointBackgroundColor: "rgba(0,123,255,1)",
          pointBorderColor: "#fff",
          data: [],
        },
      ],
    });

    const PieChartDataNiti = ref({
      labels: ["รอรับเรื่อง", "รอเบิก", "เสร็จสิ้น", "ยกเลิกการเบิก"],
      datasets: [
        {
          data: [5, 10, 8, 3],
          backgroundColor: ["primary", "secondary", "success", "danger"],
          borderWidth: 10,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue(
            "--cui-body-bg"
          ),
          hoverOffset: 10,
        },
      ],
    });

    const PieChartOptionsPie = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right", // จัดตำแหน่ง legend ด้านขวา
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 12,
            },
          },
        },
      },
      cutout: "40%",
    });

    const lineChartOptions = ref({
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    });

    const switchTab = (tab) => {
      activeTab.value = tab;
    };

    const setTimeRange = (range) => {
      timeRange.value = range;
      fetchRequestsByTimeRange();
      fetchRequestsByTimeRangeMac();
      fetchRequestsByTimeRangeManager();
    };

    const fetchRequestsByTimeRange = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const response = await axios.get(`/api/auth/getreqTimeLine?id=${userId}`);
        const requests = response.data;

        if (timeRange.value === "day") {
          const dailyCounts = {};
          requests.forEach((request) => {
            const date = new Date(request.date).toLocaleDateString();
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
          });
          lineChartData.value.labels = Object.keys(dailyCounts);
          lineChartData.value.datasets[0].data = Object.values(dailyCounts);
        } else if (timeRange.value === "month") {
          const monthlyCounts = new Array(12).fill(0);
          requests.forEach((request) => {
            const month = new Date(request.date).getMonth();
            monthlyCounts[month]++;
          });
          lineChartData.value.labels = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          lineChartData.value.datasets[0].data = monthlyCounts;
        } else if (timeRange.value === "year") {
          const yearlyCounts = {};
          requests.forEach((request) => {
            const year = new Date(request.date).getFullYear();
            yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
          });
          lineChartData.value.labels = Object.keys(yearlyCounts);
          lineChartData.value.datasets[0].data = Object.values(yearlyCounts);
        }

        lineChartData.value = { ...lineChartData.value };
      } catch (error) {
        console.error("Error fetching requests by time range:", error);
      }
    };

    const getInprogressCount = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const response = await axios.get(`/api/auth/getInprogressCount?id=${userId}`);
        items.value = {
          InprogressCount: response.data.InprogressCount || 0,
          ScheduledCount: response.data.ScheduledCount || 0,
          CompletedCount: response.data.CompletedCount || 0,
          TotalCount: response.data.TotalCount || 0,
          inprogressPercent: response.data.inprogressPercent || 0,
          scheduledPercent: response.data.scheduledPercent || 0,
          completedPercent: response.data.completedPercent || 0,
        };
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
    //=========================MAC=======================
    const getInprogressCountMac = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const response = await axios.get(
          `/api/auth/getInprogressCountforMec?id=${userId}`
        );
        itemsMac.value = {
          ScheduledCount: response.data.ScheduledCount || 0,
          CompletedCount: response.data.CompletedCount || 0,
          TotalCount: response.data.TotalCount || 0,
          scheduledPercent: response.data.scheduledPercent || 0,
          completedPercent: response.data.completedPercent || 0,
        };
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    const fetchRequestsByTimeRangeMac = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const response = await axios.get(`/api/auth/getreqTimeLineMac?id=${userId}`);
        const requests = response.data;
        if (timeRange.value === "day") {
          const dailyCounts = {};
          requests.forEach((request) => {
            const date = new Date(request.date).toLocaleDateString();
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
          });
          lineChartDataMac.value.labels = Object.keys(dailyCounts);
          lineChartDataMac.value.datasets[0].data = Object.values(dailyCounts);
        } else if (timeRange.value === "month") {
          const monthlyCounts = new Array(12).fill(0);
          requests.forEach((request) => {
            const month = new Date(request.date).getMonth();
            monthlyCounts[month]++;
          });
          lineChartDataMac.value.labels = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          lineChartDataMac.value.datasets[0].data = monthlyCounts;
        } else if (timeRange.value === "year") {
          const yearlyCounts = {};
          requests.forEach((request) => {
            const year = new Date(request.date).getFullYear();
            yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
          });
          lineChartDataMac.value.labels = Object.keys(yearlyCounts);
          lineChartDataMac.value.datasets[0].data = Object.values(yearlyCounts);
        }

        lineChartDataMac.value = { ...lineChartDataMac.value };
      } catch (error) {
        console.error("Error fetching requests by time range:", error);
      }
    };
    //======================================================

    const getInprogressCountAll = async () => {
      try {
        const response = await axios.get(`/api/auth/getInprogressCountAll`);
        itemscount.value = {
          InprogressCount: response.data.CountA || 0,
          InprogressCountpercent: response.data.Count || 0,
        };
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    //=========================MAC=======================
    const getInprogressCountManager = async () => {
      const userId = localStorage.getItem("userID");
      try {
        const response = await axios.get(
          `/api/auth/getInprogressCountforManager?id=${userId}`
        );
        itemsManager.value = {
          CommitCount: response.data.CommitCount || 0,
          CompletedCount: response.data.CompletedCount || 0,
          TotalCount: response.data.TotalCount || 0,
          CommitCountPercent: response.data.CommitCountPercent || 0,
          CompletedCountPercent: response.data.CompletedCountPercent || 0,
        };
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    const fetchRequestsByTimeRangeManager = async () => {
      try {
        const response = await axios.get(`/api/auth/getreqTimeLineManager`);
        const requests = response.data;
        if (timeRange.value === "day") {
          const dailyCounts = {};
          requests.forEach((request) => {
            const date = new Date(request.date).toLocaleDateString();
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
          });
          lineChartDataManager.value.labels = Object.keys(dailyCounts);
          lineChartDataManager.value.datasets[0].data = Object.values(dailyCounts);
        } else if (timeRange.value === "month") {
          const monthlyCounts = new Array(12).fill(0);
          requests.forEach((request) => {
            const month = new Date(request.date).getMonth();
            monthlyCounts[month]++;
          });
          lineChartDataManager.value.labels = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          lineChartDataManager.value.datasets[0].data = monthlyCounts;
        } else if (timeRange.value === "year") {
          const yearlyCounts = {};
          requests.forEach((request) => {
            const year = new Date(request.date).getFullYear();
            yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
          });
          lineChartDataManager.value.labels = Object.keys(yearlyCounts);
          lineChartDataManager.value.datasets[0].data = Object.values(yearlyCounts);
        }

        lineChartDataManager.value = { ...lineChartDataManager.value };
      } catch (error) {
        console.error("Error fetching requests by time range:", error);
      }
    };
    //======================================================

    //=========================NITI=======================
    const getInprogressCountNiti = async () => {
      try {
        const response = await axios.get(`/api/auth/getInprogressCountMainforNiti`);
        itemsNiti.value = {
          InprogressCount: response.data.InprogressCount || 0,
          WaitcheckCount: response.data.WaitcheckCount || 0,
          ScheduleCount: response.data.ScheduleCount || 0,
          CompletedCount: response.data.CompletedCount || 0,
          TotalCount: response.data.TotalCount || 0,
          CommitCountPercent: response.data.CommitCountPercent || 0,
          CompletedCountPercent: response.data.CompletedCountPercent || 0,
          ScheduleCountPercent: response.data.ScheduleCountPercent || 0,
          WaitcheckCountPercent: response.data.WaitcheckCountPercent || 0,
        };
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    const fetchRequestsByTimeRangeNiti = async () => {
      try {
        const response = await axios.get(`/api/auth/getInprogressCountReqForNiti`);
        const data = response.data || {};
        console.log("API Response:", data);
        Object.assign(PieChartDataNiti.value, {
          labels: ["รอรับเรื่องเบิก", "รอเบิก", "เสร็จสิ้น", "ยกเลิกการเบิก"],
          datasets: [
            {
              data: [
                data.WaitCommitCount || 0,
                data.WaitRqCount || 0,
                data.CompleteCount || 0,
                data.CancelCount || 0,
              ],
              backgroundColor: ["#FFCE56", "#36A2EB", "#4BC0C0", "#FF6384"],
            },
          ],
        });
        await nextTick();
      } catch (error) {
        console.error("Error fetching requests summary:", error);
      }
    };

    const fetchLowStockItem = async () => {
      try {
        const response = await axios.get("/api/auth/getCouteLowStock");
        lowStockItems.value = response.data;
      } catch (error) {
        console.error("Error fetching low stock items:", error);
      }
    };

    document.addEventListener("DOMContentLoaded", () => {
      fetchLowStockItem();
    });

    document.addEventListener("DOMContentLoaded", fetchLowStockItem);
    //======================================================

    onMounted(() => {
      fetchRequestsByTimeRange();
      fetchRequestsByTimeRangeMac();
      fetchRequestsByTimeRangeManager();
      fetchRequestsByTimeRangeNiti();
      fetchLowStockItem();
      getInprogressCountMac();
      getInprogressCount();
      getInprogressCountManager();
      getInprogressCountNiti();
      getInprogressCountAll();
      activeTab.value = showTab1
        ? "1"
        : showTab2
        ? "2"
        : showTab3
        ? "3"
        : showTab4
        ? "4"
        : null;
    });

    return {
      activeTab,
      switchTab,
      permissions,
      showTab1,
      showTab2,
      showTab3,
      showTab4,
      items,
      itemsMac,
      itemsManager,
      itemsNiti,
      itemscount,
      itemscountManager,
      lineChartData,
      lineChartDataMac,
      lineChartDataManager,
      PieChartDataNiti,
      lineChartOptions,
      PieChartOptionsPie,
      timeRange,
      lowStockItems,
      setTimeRange,
    };
  },
};
</script>

<style scoped>
.text-value {
  font-size: 1.5rem;
  font-weight: bold;
}
.low-stock-container {
  max-width: 100%;
  margin: 20px;
}

.table-wrapper {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.low-stock-table {
  width: 100%;
  border-collapse: collapse;
}

.low-stock-table th {
  position: sticky;
  top: 0;
  background-color: #f5f5f5;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
}

.low-stock-table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.low-stock-table tr:last-child td {
  border-bottom: none;
}

.status-out {
  color: white;
  background-color: #ff4444;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.status-low {
  color: white;
  background-color: #ffbb33;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}
</style>
