const initialVehicles = [
    { id: 1, type: 'generator', model: '1톤', plate: '98머7126', spec: '25kw', status: 'available', returnedAt: null },
    { id: 2, type: 'generator', model: '1톤', plate: '987도7450', spec: '30kw', status: 'available', returnedAt: null },
    { id: 3, type: 'generator', model: '2.5톤', plate: '99보9739', spec: '50kw', status: 'available', returnedAt: null },
    { id: 4, type: 'generator', model: '3.5톤', plate: '87우0443', spec: '50kw', status: 'available', returnedAt: null },
    { id: 5, type: 'generator', model: '5톤', plate: '98나3019', spec: '115kw', status: 'available', returnedAt: null },
    { id: 6, type: 'generator', model: '5톤', plate: '98서9038', spec: '150kw', status: 'available', returnedAt: null },
    { id: 7, type: 'station', model: '5톤', plate: '99거3019', spec: '5G(2식),LTE(2식),3G', status: 'available', returnedAt: null },
    { id: 8, type: 'station', model: '5톤', plate: '98무2110', spec: '5G(2식),LTE(2식)', status: 'available', returnedAt: null },
    { id: 9, type: 'station', model: '솔라티', plate: '725구5480', spec: '5G(2식),LTE(2식)', status: 'available', returnedAt: null }
];

let vehicles = JSON.parse(localStorage.getItem('vehicles')) || initialVehicles;
let selectedVehicle = null;
let currentPhotos = [];

function renderVehicles(category = 'all') {
    const container = document.getElementById('vehicle-list');
    container.innerHTML = '';
    const filtered = category === 'all' ? vehicles : vehicles.filter(v => v.type === category);

    filtered.forEach(v => {
        const card = document.createElement('div');
        card.className = 'glass vehicle-card';

        let statusText = '대여가능';
        let statusClass = 'available';
        if (v.status === 'in-use') {
            statusText = '사용중';
            statusClass = 'in-use';
        } else if (v.status === 'returning') {
            const remaining = getRemainingTime(v.returnedAt);
            statusText = `반납완료 (${remaining})`;
            statusClass = 'returning';
        }

        card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
        <h3 style="font-size: 1.1rem;">${v.plate}</h3>
        <span class="category-badge">${v.model}</span>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">${v.spec}</p>
      <div style="text-align: right; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; margin-top: 0.5rem;">
        <div>
          <span class="status-dot status-${statusClass}"></span>
          <span style="font-size: 0.8rem; margin-left: 0.25rem; color: var(--text-secondary);">${statusText}</span>
        </div>
        ${v.status === 'in-use' ? `
          <button class="return-btn" data-vehicle-id="${v.id}" 
            style="padding: 0.25rem 0.75rem; border-radius: 0.5rem; border: 1px solid var(--accent-cyan); background: transparent; color: var(--accent-cyan); cursor: pointer; font-size: 0.75rem;">
            반납완료
          </button>
        ` : ''}
      </div>
    `;

        // Make entire card clickable
        if (v.status !== 'returning') {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the return button
                if (!e.target.closest('.return-btn')) {
                    startInspection(v);
                }
            });
        } else {
            card.style.cursor = 'not-allowed';
        }

        // Add return button listener
        const returnBtn = card.querySelector('.return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setReturningStatus(v.id);
            });
        }
        container.appendChild(card);
    });
}

function getRemainingTime(returnedAt) {
    if (!returnedAt) return '0분';
    const elapsed = Date.now() - returnedAt;
    const remainingMs = Math.max(0, (5 * 60 * 1000) - elapsed);
    const mins = Math.ceil(remainingMs / (60 * 1000));
    return `${mins}분 후 대여가능`;
}

function setReturningStatus(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && confirm(`${vehicle.plate} 차량을 '반납완료' 처리하시겠습니까?\\n(5분 후 자동으로 '대여가능'으로 변경됩니다.)`)) {
        vehicle.status = 'returning';
        vehicle.returnedAt = Date.now();
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        renderVehicles();
    }
}

// Background timer to check returning status
setInterval(() => {
    let changed = false;
    const now = Date.now();
    vehicles.forEach(v => {
        if (v.status === 'returning' && v.returnedAt) {
            if (now - v.returnedAt >= 5 * 60 * 1000) {
                v.status = 'available';
                v.returnedAt = null;
                changed = true;
            }
        }
    });

    if (changed) {
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        renderVehicles();
    } else {
        const returningVehicles = vehicles.filter(v => v.status === 'returning');
        if (returningVehicles.length > 0) {
            renderVehicles();
        }
    }
}, 10000);

function showView(viewId) {
    document.getElementById('view-dashboard').style.display = viewId === 'dashboard' ? 'block' : 'none';
    document.getElementById('view-inspection').style.display = viewId === 'inspection' ? 'block' : 'none';
}

function startInspection(vehicle) {
    if (vehicle.status === 'returning') return;
    selectedVehicle = vehicle;
    document.getElementById('inspection-title').innerText = `${vehicle.plate} 점검 등록`;
    const checklist = document.getElementById('checklist');
    checklist.innerHTML = '';

    const stationItems = [
        {
            section: '[이동기지국 상단]', items: [
                { label: '1. 안테나 하단부 급전선 구간', options: ['양호', '불량'] },
                { label: '2. 상단부 청소 및 안테나 정리상태', options: ['양호', '불량'] },
                { label: '3. 급전선 및 전원선 정리상태', options: ['양호', '불량'] },
                { label: '4. 차량공구', options: ['양호', '불량'] }
            ]
        },
        {
            section: '[이동기지국 내부]', items: [
                { label: '1. LTE장비 시건상태', options: ['양호', '불량'] },
                { label: '2. 이동기지국 내 청소 및 정돈상태', options: ['양호', '불량'] }
            ]
        }
    ];

    const generatorItems = [
        {
            section: '[발전차 내부]', items: [
                { label: '1. 전원선 정리상태', options: ['양호', '불량'] },
                { label: '2. 발전차 패널 DC OFF상태', options: ['유', '무'] },
                { label: '3. 운행km 및 기름잔량 표기를 4/1, 4/2, 4/3, 4/4(출발km, 도착km 기입요청)', type: 'mileage' }
            ]
        }
    ];

    // Show all sections for all vehicles
    const sections = [...stationItems, ...generatorItems];

    sections.forEach((section, sIndex) => {
        const sectionTitle = document.createElement('h4');
        sectionTitle.style.color = 'var(--accent-cyan)';
        sectionTitle.style.marginTop = '1.5rem';
        sectionTitle.style.marginBottom = '0.75rem';
        sectionTitle.innerText = section.section;
        checklist.appendChild(sectionTitle);

        section.items.forEach((item, iIndex) => {
            const idx = `${sIndex}-${iIndex}`;
            const div = document.createElement('div');
            div.style.marginBottom = '1rem';

            if (item.type === 'mileage') {
                const isCheckout = selectedVehicle.status === 'available';
                div.innerHTML = `
          <div style="margin-bottom: 0.5rem;"><span>${item.label}</span></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              ${isCheckout ? `
                <input type="text" placeholder="출발km" class="glass mileage-start" style="width: 100%; padding: 0.5rem; border: none; outline: none; color: white; font-size: 0.85rem;">
              ` : `
                <input type="text" placeholder="도착km" class="glass mileage-end" style="width: 100%; padding: 0.5rem; border: none; outline: none; color: white; font-size: 0.85rem;">
              `}
            </div>
            <div>
              <div style="margin-bottom: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">기름잔량</div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.25rem;">
                <label style="display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; cursor: pointer;">
                  <input type="radio" name="fuel-level-${idx}" value="4/4" checked style="margin-bottom: 0.15rem;">
                  <span>4/4</span>
                </label>
                <label style="display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; cursor: pointer;">
                  <input type="radio" name="fuel-level-${idx}" value="4/3" style="margin-bottom: 0.15rem;">
                  <span>4/3</span>
                </label>
                <label style="display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; cursor: pointer;">
                  <input type="radio" name="fuel-level-${idx}" value="4/2" style="margin-bottom: 0.15rem;">
                  <span>4/2</span>
                </label>
                <label style="display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; cursor: pointer;">
                  <input type="radio" name="fuel-level-${idx}" value="4/1" style="margin-bottom: 0.15rem;">
                  <span>4/1</span>
                </label>
              </div>
            </div>
          </div>
        `;
            } else {
                const option1 = item.options[0];
                const option2 = item.options[1];
                div.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 0;">
            <span>${item.label}</span>
            <div style="display: flex; gap: 1rem;">
              <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem;">
                <input type="radio" name="check-${idx}" value="${option1}" checked onchange="toggleDefectText('${idx}', false)"> ${option1}
              </label>
              <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem;">
                <input type="radio" name="check-${idx}" value="${option2}" onchange="toggleDefectText('${idx}', true)"> ${option2}
              </label>
            </div>
          </div>
          <div id="defect-text-${idx}" style="display: none; margin-top: 0.5rem;">
            <input type="text" placeholder="세부 내용을 입력하세요" class="glass defect-detail" 
              style="width: 100%; padding: 0.5rem; border: none; outline: none; color: white; font-size: 0.85rem;">
          </div>
        `;
            }
            checklist.appendChild(div);
        });
    });

    showView('inspection');
    lucide.createIcons();
}

function toggleDefectText(index, show) {
    const textDiv = document.getElementById(`defect-text-${index}`);
    if (textDiv) {
        textDiv.style.display = show ? 'block' : 'none';
    }
}

function takePhoto() {
    document.getElementById('input-photo').click();
}

function handlePhoto(event) {
    const files = Array.from(event.target.files);
    if (currentPhotos.length + files.length > 4) {
        alert('사진은 최대 4장까지만 업로드 가능합니다.');
        return;
    }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentPhotos.push(e.target.result);
            renderPhotoPreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderPhotoPreviews() {
    const container = document.getElementById('photo-preview');
    container.innerHTML = '';

    if (currentPhotos.length > 0) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(2, 1fr)';
        container.style.gap = '0.5rem';
        container.style.marginTop = '1rem';

        currentPhotos.forEach((photo, idx) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.style.position = 'relative';
            imgWrapper.innerHTML = `
        <img src="${photo}" style="width: 100%; border-radius: 0.5rem;">
        <button onclick="removePhoto(${idx})" style="position: absolute; top: 5px; right: 5px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;">×</button>
      `;
            container.appendChild(imgWrapper);
        });
    } else {
        container.style.display = 'none';
    }
}

function removePhoto(index) {
    currentPhotos.splice(index, 1);
    renderPhotoPreviews();
}

function submitInspection() {
    const team = document.getElementById('input-team').value;
    const operator = document.getElementById('input-operator').value;
    if (!team || !operator) return alert('팀명과 운행자를 모두 입력해주세요.');

    const checklistDivs = document.getElementById('checklist').children;
    let reportItems = [];

    Array.from(checklistDivs).forEach(div => {
        if (div.tagName === 'H4') {
            reportItems.push({ type: 'section', label: div.innerText });
        } else {
            const labelSpan = div.querySelector('span');
            if (labelSpan) {
                const label = labelSpan.innerText;
                const mileageStart = div.querySelector('.mileage-start');
                const mileageEnd = div.querySelector('.mileage-end');
                if (mileageStart || mileageEnd) {
                    const kmValue = mileageStart ? mileageStart.value : mileageEnd.value;
                    const kmType = mileageStart ? '출발' : '도착';
                    const fuelRadio = div.querySelector('input[name^="fuel-level"]:checked');
                    const fuelLevel = fuelRadio ? fuelRadio.value : '4/4';
                    reportItems.push({ label, value: `${kmType}: ${kmValue}km, 기름잔량: ${fuelLevel}` });
                } else {
                    const checkedRadio = div.querySelector('input[type="radio"]:checked');
                    if (checkedRadio) {
                        const value = checkedRadio.value;
                        const detailInput = div.querySelector('.defect-detail');
                        const detail = detailInput && (value === '불량' || value === '유') ? detailInput.value : '';
                        reportItems.push({ label, value, detail });
                    }
                }
            }
        }
    });

    const isCheckout = selectedVehicle.status === 'available';
    if (isCheckout) {
        selectedVehicle.status = 'in-use';
        selectedVehicle.returnedAt = null;
    } else {
        selectedVehicle.status = 'returning';
        selectedVehicle.returnedAt = Date.now();
    }

    localStorage.setItem('vehicles', JSON.stringify(vehicles));

    const date = new Date().toLocaleString();
    const typeText = isCheckout ? '[대여]' : '[반납기록]';
    let body = `${typeText} 특수차량 점검 보고서\\n\\n`;
    body += `일시: ${date}\\n`;
    body += `차량: ${selectedVehicle.plate} (${selectedVehicle.model})\\n`;
    body += `팀명: ${team}\\n`;
    body += `운행자: ${operator}\\n\\n`;
    body += `[특수차량 체크리스트]\\n`;

    reportItems.forEach(item => {
        if (item.type === 'section') {
            body += `\\n${item.label}\\n`;
        } else {
            body += `- ${item.label}: ${item.value}`;
            if (item.detail) {
                body += ` (내용: ${item.detail})`;
            }
            body += `\\n`;
        }
    });

    if (currentPhotos.length > 0) {
        body += `\\n* 불량 관련 사진 ${currentPhotos.length}장이 촬영되었습니다. (메일 발송 시 수동 첨부 필요)`;
    }

    // Create Excel file using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('특수차량 체크리스트');

    // Set column widths
    worksheet.columns = [
        { key: 'item', width: 60 },   // A열: 항목
        { key: 'good', width: 10 },   // B열: 양호/유
        { key: 'bad', width: 10 }     // C열: 불량/무
    ];

    // 1. Title Row
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '특수차량 체크리스트';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { bold: true, size: 16 };
    worksheet.getRow(1).height = 30;

    // 2. Info Row (Date, Plate, etc.) - Optional, but helpful context above the list
    worksheet.mergeCells('A2:C2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `일시: ${date} | 차량: ${selectedVehicle.plate} (${selectedVehicle.model})`;
    infoCell.alignment = { vertical: 'middle', horizontal: 'right' };
    infoCell.font = { size: 10 };

    let currentRowIndex = 3;

    reportItems.forEach(item => {
        if (item.type === 'section') {
            // Section Header Row
            const row = worksheet.getRow(currentRowIndex);
            row.values = [item.label, '양호', '불량'];

            // Style Section Header
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }; // Light Blue
            row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
            row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
            row.font = { bold: true };
            row.alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

            // Borders
            [1, 2, 3].forEach(c => {
                row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            currentRowIndex++;
        } else {
            // Item Row
            const row = worksheet.getRow(currentRowIndex);

            let goodMark = '';
            let badMark = '';
            let itemLabel = item.label;

            // Handle Mileage/Fuel separately
            if (item.label.includes('Km') || item.label.includes('km')) {
                // Append value to label for mileage/fuel items
                itemLabel += `\n[결과] ${item.value}`;
            } else {
                // O/X Logic for standard items
                if (item.value === '양호' || item.value === '유') {
                    goodMark = 'O';
                } else if (item.value === '불량' || item.value === '무') {
                    badMark = 'O'; // Mark 'Bad' column
                    if (item.detail) {
                        itemLabel += `\n(불량내용: ${item.detail})`;
                    }
                }
            }

            row.getCell(1).value = itemLabel;
            row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            // Special handling to match the template's look for the Mileage item
            if (itemLabel.includes('기름잔량 표기를')) {
                // If the text doesn't already have the sub-note (it might if we changed the data source, but let's be safe)
                if (!itemLabel.includes('(기름잔량 4/1')) {
                    const parts = itemLabel.split('\n[결과]');
                    // Reconstruct with the sub-note from the image
                    row.getCell(1).value = parts[0] + '\n(기름잔량 4/1, 4/2, 4/3, 4/4 표기)' + (parts[1] ? '\n[결과]' + parts[1] : '');
                }
            }

            row.getCell(2).value = goodMark;
            row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

            row.getCell(3).value = badMark;
            row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

            // Borders
            [1, 2, 3].forEach(c => {
                row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            currentRowIndex++;
        }
    });

    // Footer: Team and Operator
    const footerStartRow = currentRowIndex;

    // Team Row
    const teamRow = worksheet.getRow(footerStartRow);
    teamRow.getCell(1).value = '차량 대여팀';
    teamRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    worksheet.mergeCells(`B${footerStartRow}:C${footerStartRow}`);
    teamRow.getCell(2).value = team;
    teamRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    // Operator Row
    const operatorRow = worksheet.getRow(footerStartRow + 1);
    operatorRow.getCell(1).value = '운행자';
    operatorRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    worksheet.mergeCells(`B${footerStartRow + 1}:C${footerStartRow + 1}`);
    operatorRow.getCell(2).value = operator;
    operatorRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    // Footer Borders
    [0, 1].forEach(offset => {
        const r = footerStartRow + offset;
        worksheet.getRow(r).eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= 3) {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        });
    });

    // Add Photos if any
    if (currentPhotos.length > 0) {
        let photoRowIndex = footerStartRow + 3;
        const photoHeader = worksheet.getRow(photoRowIndex);
        photoHeader.getCell(1).value = '첨부 사진';
        photoHeader.font = { bold: true };
        photoRowIndex++;

        currentPhotos.forEach((photoDataUrl, idx) => {
            const imageId = workbook.addImage({
                base64: photoDataUrl,
                extension: 'png',
            });

            // Position images: 2 images per row
            const col = (idx % 2) * 4; // 0 or 4 (start at A or E - actually merged so we use visual columns)
            // Simpler approach: Stack them vertically or 2x2. 
            // Let's put them in A column, spanning width.

            const rowStart = photoRowIndex + (Math.floor(idx / 2) * 10);

            worksheet.addImage(imageId, {
                tl: { col: (idx % 2) * 1.5, row: rowStart }, // Adjust column to place side-by-side
                ext: { width: 300, height: 300 }
            });
        });
    }

    // Generate and download/share Excel file
    workbook.xlsx.writeBuffer().then(async (buffer) => {
        const fileName = `특수차량체크리스트_${selectedVehicle.plate}_${team}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Try Web Share API first (Mobile)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: '특수차량 점검 보고서',
                    text: `${typeText} ${selectedVehicle.plate} (${team}, ${operator}) 점검 보고서입니다.`
                });
                alert('보고서가 공유되었습니다.');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                    saveAs(blob, fileName); // Fallback to download
                }
            }
        } else {
            // Fallback for PC or unsupported browsers
            saveAs(blob, fileName);
            const mailtoLink = `mailto:piaagio@ktmos.co.kr?subject=${encodeURIComponent(`${typeText} ${selectedVehicle.plate}_${team}_${operator}`)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            alert(`보고서가 생성되었습니다. (이메일에 수동으로 첨부해주세요)\n${!isCheckout ? '\n이제 5분 동안 [반납완료] 상태로 유지됩니다.' : ''}`);
        }
    });

    document.getElementById('input-team').value = '';
    document.getElementById('input-operator').value = '';
    currentPhotos = [];
    renderPhotoPreviews();

    showView('dashboard');
    renderVehicles();
}

function filterCategory(cat) {
    renderVehicles(cat);
    const btns = document.querySelectorAll('#view-dashboard .btn');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

renderVehicles();
lucide.createIcons();
