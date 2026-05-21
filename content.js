// Content Script để thêm nút xuất PDF vào trang tra cứu điểm

(function() {
    'use strict';

    // Hàm chờ element xuất hiện
    function waitForElement(selector, callback) {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);

            if (element) {
                clearInterval(interval);
                callback(element);
            }
        }, 1000);
    }

    waitForElement('#zone_bangdiem', () => {
        createExportButton();
    });

    // Hàm tính điểm trung bình hệ 4
    function calculateGPA4(subjects) {
        let totalCredits = 0;
        let totalPoints = 0;

        subjects.forEach(subject => {
            const credits = parseFloat(subject.credits);
            const grade4 = parseFloat(subject.grade4);
            
            if (!isNaN(credits) && !isNaN(grade4)) {
                totalCredits += credits;
                totalPoints += credits * grade4;
            }
        });

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    }

    // Hàm tính điểm trung bình hệ 10
    function calculateGPA10(subjects) {
        let totalCredits = 0;
        let totalPoints = 0;

        subjects.forEach(subject => {
            const credits = parseFloat(subject.credits);
            const grade10 = parseFloat(subject.grade10);
            
            if (!isNaN(credits) && !isNaN(grade10)) {
                totalCredits += credits;
                totalPoints += credits * grade10;
            }
        });

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    }

    // Hàm lấy thông tin cá nhân
    function getPersonalInfo() {
        const info = {};
        
        info.name = document.querySelector('.lblHoTen')?.textContent.trim() || '';
        info.studentId = document.querySelector('#lblMaSo')?.textContent.trim() || '';
        info.dateOfBirth = document.querySelector('#lblNgaySinh')?.textContent.trim() || '';
        info.class = document.querySelector('#lblLop')?.textContent.trim() || '';
        info.major = document.querySelector('#lblChuyenNganh')?.textContent.trim() || '';
        info.course = document.querySelector('#lblKhoaHoc')?.textContent.trim() || '';
        
        return info;
    }

    // Hàm lấy thông tin tổng điểm
    function getSummaryInfo() {
        const info = {};
        
        info.totalCredits = document.querySelector('#lblTongTinChi')?.textContent.trim() || '0';
        info.completedCredits = document.querySelector('#lblTinChiTichLuy')?.textContent.trim() || '0';
        info.avgGPA10 = document.querySelector('#lblDiemTrungBinhHe10')?.textContent.trim() || '0';
        info.avgGPA4 = document.querySelector('#lblDiemTrungBinhHe4')?.textContent.trim() || '0';
        info.cumulativeGPA10 = document.querySelector('#lblDiemTrungBinhTichLuyHe10')?.textContent.trim() || '0';
        info.cumulativeGPA4 = document.querySelector('#lblDiemTrungBinhTichLuyHe4')?.textContent.trim() || '0';
        
        return info;
    }

    // Hàm lấy dữ liệu bảng điểm theo từng học kỳ
    function getSemesterData() {
        const semesters = [];
        const accordionItems = document.querySelectorAll('#zone_bangdiem .accordion-item');
        
        accordionItems.forEach(item => {
            const semesterHeader = item.querySelector('.header.banghocphan span')?.textContent.trim();
            if (!semesterHeader) return;
            
            const subjects = [];
            const rows = item.querySelectorAll('table.transcrip-table tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 11) return;
                
                const subject = {
                    stt: row.querySelector('th span')?.textContent.trim() || '',
                    code: cells[0]?.querySelector('span')?.textContent.trim() || '',
                    name: cells[1]?.querySelector('span')?.textContent.trim() || '',
                    credits: cells[2]?.querySelector('span')?.textContent.trim() || '',
                    attempt: cells[3]?.querySelector('span')?.textContent.trim() || '',
                    exam: cells[4]?.querySelector('span')?.textContent.trim() || '',
                    grade10: cells[5]?.querySelector('span')?.textContent.trim() || '',
                    grade4: cells[6]?.querySelector('span')?.textContent.trim() || '',
                    gradeLetter: cells[7]?.querySelector('span')?.textContent.trim() || '',
                    result: cells[8]?.querySelector('span')?.textContent.trim() || '',
                    note: cells[9]?.querySelector('span')?.textContent.trim() || ''
                };
                
                subjects.push(subject);
            });
            
            // Lấy thông tin tổng kết học kỳ
            const summaryRows = item.querySelectorAll('.summary-row');
            const summary = {
                credits: '',
                cumulativeCredits: '',
                avgGPA10: '',
                avgGPA4: '',
                cumulativeGPA10: '',
                cumulativeGPA4: ''
            };
            
            summaryRows.forEach(row => {
                const label = row.querySelector('.color-66')?.textContent.trim() || '';
                const value = row.querySelector('span:last-child')?.textContent.trim() || '';
                
                if (label.includes('Tổng tín chỉ') && !label.includes('tích lũy')) {
                    summary.credits = value;
                } else if (label.includes('Tổng số tín chỉ tích lũy')) {
                    summary.cumulativeCredits = value;
                } else if (label.includes('Điểm trung bình hệ 10') && !label.includes('tích lũy')) {
                    summary.avgGPA10 = value;
                } else if (label.includes('Điểm trung bình hệ 4') && !label.includes('tích lũy')) {
                    summary.avgGPA4 = value;
                } else if (label.includes('Điểm trung bình tích lũy hệ 10')) {
                    summary.cumulativeGPA10 = value;
                } else if (label.includes('Điểm trung bình tích lũy hệ 4')) {
                    summary.cumulativeGPA4 = value;
                }
            });
            
            // Tính điểm trung bình nếu thiếu
            if (summary.avgGPA10 === '...' || summary.avgGPA10 === '') {
                summary.avgGPA10 = calculateGPA10(subjects);
            }
            if (summary.avgGPA4 === '...' || summary.avgGPA4 === '') {
                summary.avgGPA4 = calculateGPA4(subjects);
            }
            
            semesters.push({
                name: semesterHeader,
                subjects: subjects,
                summary: summary
            });
        });
        
        return semesters;
    }

    // Hàm tạo HTML cho trang in
    function generatePrintHTML(personalInfo, summaryInfo, semesters) {
        let html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảng Điểm - ${personalInfo.studentId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            padding: 20px;
            background: white;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
        }
        
        .header h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .header h2 {
            font-size: 20px;
            color: #333;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 14px;
            color: #333;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            background: #333;
            color: #333;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 30px;
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #333;
        }
        
        .info-item {
            display: flex;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 150px;
            color: #333;
        }
        
        .info-value {
            color: #333;
        }
        
        .summary-box {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-item .label {
            font-size: 12px;
            color: #333;
            margin-bottom: 5px;
        }
        
        .summary-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .semester {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .semester-header {
            background: #333;
            color: #333;
            padding: 12px 15px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 13px;
        }
        
        table thead {
            background: #333;
            color: #333;
        }
        
        table th {
            padding: 10px 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #333;
        }
        
        table td {
            padding: 8px;
            border: 1px solid #333;
        }
        
        table tbody tr:nth-child(even) {
            background: white;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-left {
            text-align: left;
        }
        
        .semester-summary {
            background: white;
            padding: 15px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .semester-summary-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
        }
        
        .semester-summary-label {
            font-weight: bold;
            color: #333;
        }
        
        .semester-summary-value {
            color: #333;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            text-align: right;
            font-style: italic;
            color: #333;
        }
        
        @media print {
            body {
                padding: 10px;
            }
            
            .container {
                max-width: 100%;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .semester {
                page-break-inside: avoid;
            }
            
            @page {
                margin: 1cm;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Đại học Giao thông Vận tải</h1>
            <h2>Bảng Điểm Sinh Viên</h2>
            <p>University of Transport and Communications</p>
        </div>
        
        <div class="section">
            <div class="section-title">Thông Tin Sinh Viên</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Họ và tên:</span>
                    <span class="info-value">${personalInfo.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Mã sinh viên:</span>
                    <span class="info-value">${personalInfo.studentId}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Ngày sinh:</span>
                    <span class="info-value">${personalInfo.dateOfBirth}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Lớp:</span>
                    <span class="info-value">${personalInfo.class}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Chuyên ngành:</span>
                    <span class="info-value">${personalInfo.major}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Khóa học:</span>
                    <span class="info-value">${personalInfo.course}</span>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Tổng Hợp Kết Quả Học Tập</div>
            <div class="summary-box">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="label">Tổng số tín chỉ</div>
                        <div class="value">${summaryInfo.totalCredits}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Tín chỉ tích lũy</div>
                        <div class="value">${summaryInfo.completedCredits}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">ĐTB Tích lũy (Hệ 10)</div>
                        <div class="value">${summaryInfo.cumulativeGPA10}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Bảng Điểm Chi Tiết Theo Học Kỳ</div>
`;

        // Thêm dữ liệu từng học kỳ
        semesters.forEach(semester => {
            html += `
            <div class="semester">
                <div class="semester-header">${semester.name}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">STT</th>
                            <th style="width: 100px;">Mã HP</th>
                            <th>Tên học phần</th>
                            <th style="width: 60px;">Tín chỉ</th>
                            <th style="width: 70px;">Điểm 10</th>
                            <th style="width: 70px;">Điểm 4</th>
                            <th style="width: 70px;">Điểm chữ</th>
                            <th style="width: 80px;">Kết quả</th>
                        </tr>
                    </thead>
                    <tbody>
`;
            
            semester.subjects.forEach(subject => {
                html += `
                        <tr>
                            <td class="text-center">${subject.stt}</td>
                            <td class="text-center">${subject.code}</td>
                            <td class="text-left">${subject.name}</td>
                            <td class="text-center">${subject.credits}</td>
                            <td class="text-center">${subject.grade10}</td>
                            <td class="text-center">${subject.grade4}</td>
                            <td class="text-center">${subject.gradeLetter}</td>
                            <td class="text-center">${subject.result}</td>
                        </tr>
`;
            });
            
            html += `
                    </tbody>
                </table>
                <div class="semester-summary">
                    <div class="semester-summary-item">
                        <span class="semester-summary-label">Tổng tín chỉ:</span>
                        <span class="semester-summary-value">${semester.summary.credits}</span>
                    </div>
                    <div class="semester-summary-item">
                        <span class="semester-summary-label">ĐTB Hệ 10:</span>
                        <span class="semester-summary-value">${semester.summary.avgGPA10}</span>
                    </div>
                    <div class="semester-summary-item">
                        <span class="semester-summary-label">ĐTB Hệ 4:</span>
                        <span class="semester-summary-value">${semester.summary.avgGPA4}</span>
                    </div>
                    <div class="semester-summary-item">
                        <span class="semester-summary-label">Tín chỉ tích lũy:</span>
                        <span class="semester-summary-value">${semester.summary.cumulativeCredits}</span>
                    </div>
                    <div class="semester-summary-item">
                        <span class="semester-summary-label">ĐTBTL Hệ 10:</span>
                        <span class="semester-summary-value">${semester.summary.cumulativeGPA10}</span>
                    </div>
                    <div class="semester-summary-item">
                        <span class="semester-summary-label">ĐTBTL Hệ 4:</span>
                        <span class="semester-summary-value">${semester.summary.cumulativeGPA4}</span>
                    </div>
                </div>
            </div>
`;
        });
        
        html += `
        </div>
        
        <div class="footer">
            <p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        </div>
    </div>
</body>
</html>
`;
        
        return html;
    }

    // Hàm xuất PDF
    function exportToPDF() {
        try {
            // Lấy dữ liệu
            const personalInfo = getPersonalInfo();
            const summaryInfo = getSummaryInfo();
            const semesters = getSemesterData();
            
            // Tạo HTML
            const html = generatePrintHTML(personalInfo, summaryInfo, semesters);
            
            // Mở cửa sổ in
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            
            // Chờ tải xong rồi in
            printWindow.onload = function() {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
            
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);
            alert('Đã có lỗi xảy ra khi xuất bảng điểm. Vui lòng thử lại!');
        }
    }

    // Hàm thêm nút xuất PDF
    function addExportButton() {
        // Tìm vị trí để chèn nút (sau phần thông tin cá nhân)
        const profileSection = document.querySelector('.sspace-profile');
        if (!profileSection) {
            console.error('Không tìm thấy phần thông tin cá nhân');
            return;
        }

        // Kiểm tra xem nút đã tồn tại chưa
        if (document.getElementById('utc-export-btn')) {
            return;
        }

        // Tạo nút xuất PDF
        const exportButton = document.createElement('button');
        exportButton.id = 'utc-export-btn';
        exportButton.className = 'utc-export-button';
        exportButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Xuất Bảng Điểm PDF</span>
        `;
        
        exportButton.addEventListener('click', exportToPDF);
        
        // Chèn nút sau phần profile
        profileSection.parentNode.insertBefore(exportButton, profileSection.nextSibling);
        
        console.log('Đã thêm nút xuất PDF thành công');
    }

    // Khởi chạy khi trang load xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addExportButton, 1000);
        });
    } else {
        setTimeout(addExportButton, 1000);
    }

    // Quan sát thay đổi DOM để đảm bảo nút luôn có
    const observer = new MutationObserver(() => {
        if (!document.getElementById('utc-export-btn')) {
            addExportButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
