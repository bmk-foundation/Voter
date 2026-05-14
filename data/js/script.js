/* ১. */
const firebaseConfig = {
    apiKey: "AIzaSyAzGK_y9kx5oVFL1-rGTnSDxDvdYoVIqOg",
    authDomain: "bmkf-donation-system.firebaseapp.com",
    databaseURL: "https://bmkf-donation-system-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bmkf-donation-system",
    storageBucket: "bmkf-donation-system.firebasestorage.app",
    messagingSenderId: "718912081844",
    appId: "1:718912081844:web:98d102b1a6dc07464cace1"
};

if (!firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}
const database = firebase.database();

let deferredPrompt;
const slider = document.getElementById('install-slider');
const installBtn = document.getElementById('install-btn');
const closeBtn = document.getElementById('close-slider');

window.addEventListener('beforeinstallprompt', (e) => {
    // ডিফল্ট প্রম্পট বন্ধ করা
    e.preventDefault();
    deferredPrompt = e;
    
    // স্লাইডার এলিমেন্টটি পেজে আছে কি না চেক করে দেখানো
    if (slider) {
        setTimeout(() => {
            slider.style.display = 'flex'; // CSS-এ hidden থাকলে display ঠিক করা
            slider.classList.add('show-slider');
        }, 3000);
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User installed the app');
            }
            deferredPrompt = null;
            if (slider) slider.classList.remove('show-slider');
            // অল্প সময় পর পুরোপুরি হাইড করে দেওয়া
            setTimeout(() => { if (slider) slider.style.display = 'none'; }, 500);
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (slider) {
            slider.classList.remove('show-slider');
            setTimeout(() => { slider.style.display = 'none'; }, 500);
        }
    });
}

/**
 * ২. গ্লোবাল ভেরিয়েবল ও ডেটা সেটআপ
 */
let currentSearchMode = 'name';
let localVoterList = []; 

const unionData = {
    "নাগেশ্বরী": ["বামনডাঙ্গা"],
    "ভূরুঙ্গামারী": [
        "পাথরডুবি", "শিলখুড়ি", "তিলাই", "পাইকেরছড়া", "ভূরুঙ্গামারী", 
        "জয়মনিরহাট", "আন্ধারীঝাড়", "বলদিয়া", "চর-ভূরুঙ্গামারী", "বঙ্গঁসোনাহাট"
    ]
};

/**
 * ৩. ইউটিলিটি ফাংশনসমূহ (কনভার্টার ও ফরম্যাটার)
 */
function enToBn(number) {
    if (!number) return "০";
    const bnNums = { 
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', 
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' 
    };
    return number.toString().split('').map(char => bnNums[char] || char).join('');
}

function parseToNum(str) {
    if (!str) return null;
    const enStr = str.toString().replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
    return parseInt(enStr, 10);
}

function formatToThreeDigitBn(num) {
    let enFormatted = num.toString().padStart(3, '0');
    return enToBn(enFormatted);
}

/**
 * ৪. নেভিগেশন ও মেনু কন্ট্রোল
 */
function openNav() {
    document.getElementById("side-menu").style.width = "260px";
    document.getElementById("side-menu").style.left = "0";
    document.getElementById("menu-overlay").classList.remove("hidden");
    document.body.classList.add('no-scroll');
}

function closeNav() {
    document.getElementById("side-menu").style.width = "0";
    document.getElementById("side-menu").style.left = "-280px";
    document.getElementById("menu-overlay").classList.add("hidden");
    document.body.classList.remove('no-scroll');
}

function goToHome() {
    // ১. সাইড মেনু বন্ধ করা
    if (typeof closeNav === "function") closeNav();

    // ২. সেকশনগুলো ঠিকভাবে টগল করা
    const homeSection = document.getElementById('home-section');
    const searchSection = document.getElementById('search-section');
    const progressLoader = document.getElementById('work-in-progress');

    if (homeSection) homeSection.classList.remove('hidden');
    if (searchSection) searchSection.classList.add('hidden');
    
    // ৩. যদি কোনো লোডার বা প্রগ্রেস বার থাকে তা লুকিয়ে রাখা (প্রয়োজন হলে block করবেন)
    if (progressLoader) progressLoader.style.display = 'none';

    // ৪. আগের সার্চ রেজাল্ট এবং UI রিসেট করা
    const resultArea = document.getElementById('resultArea');
    if (resultArea) resultArea.innerHTML = "";
    
    isAtHome = true;
    if (typeof resetSearchUI === "function") resetSearchUI();

    // ৫. হোম স্ট্যাটাস এরিয়া হ্যান্ডেল করা
    const homeStatsArea = document.getElementById('home-union-stats-area');
    if (homeStatsArea) homeStatsArea.style.display = 'block';

    // ৬. ইউনিয়ন সিলেক্ট করা থাকলে স্ট্যাটাস কার্ডটি দেখানো
    const statsCard = document.getElementById('home-stats-card');
    const homeSelect = document.getElementById('home-union-select');
    
    if (statsCard && homeSelect) {
        if (homeSelect.value !== "") {
            statsCard.classList.remove('hidden');
        } else {
            statsCard.classList.add('hidden');
        }
    }
    
    // ৭. স্ক্রল করে পেজের উপরে নিয়ে আসা (ইউজার এক্সপেরিয়েন্সের জন্য ভালো)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function resetSearchUI() {
    document.getElementById('input-label').classList.remove('hidden');
    const searchBtn = document.querySelector('button[onclick="searchVoter()"]');
    if (searchBtn) searchBtn.style.display = "block";
    document.getElementById('scanner-wrapper').classList.add('hidden');
    document.getElementById('dynamic-input-area').classList.remove('hidden');
}

/**
 * ৫. সার্চ পেজ ও ইনপুট কন্ট্রোল
 */
function showSearchPage(mode) {
    currentSearchMode = mode;
    closeNav();
    resetSearchUI();
    document.getElementById('work-in-progress').style.display = 'none';
    
    const homeStatsArea = document.getElementById('home-union-stats-area');
    if (homeStatsArea) homeStatsArea.style.display = 'none';

    history.pushState({ page: 'search' }, "Search", "");
    
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('search-section').classList.remove('hidden');
    document.getElementById('resultArea').innerHTML = "";
    
    const inputArea = document.getElementById('dynamic-input-area');
    const title = document.getElementById('search-title');
    
    if (mode === 'dob') {
        title.innerText = "জন্ম তারিখ দিয়ে অনুসন্ধান";
        inputArea.innerHTML = `
            <input type="text" id="searchInput" oninput="handleNameInput(this.value)" placeholder="জন্ম তারিখ (উদা: ২৩/০৪/২০০৬)" autocomplete="off">
            <div id="suggestion-box" class="suggestion-style hidden"></div>`;
    } else if (mode === 'name') {
        title.innerText = "নাম দিয়ে অনুসন্ধান";
        inputArea.innerHTML = `
            <input type="text" id="searchInput" oninput="handleNameInput(this.value)" placeholder="ভোটারের নাম লিখুন..." autocomplete="off">
            <div id="suggestion-box" class="suggestion-style hidden"></div>`;
    } else if (mode === 'serial') {
        title.innerText = "সিরিয়াল দিয়ে অনুসন্ধান";
        inputArea.innerHTML = `
            <input type="number" id="searchInput" oninput="handleNameInput(this.value)" placeholder="সিরিয়াল নম্বর দিন..." autocomplete="off">
            <div id="suggestion-box" class="suggestion-style hidden"></div>`;
    }
}

window.onpopstate = function(event) {
    goToHome();
};

/**
 * ৬. ড্রপডাউন ও স্পেশাল ওয়ার্ড লজিক
 */
function updateUnions() {
    const upazila = document.getElementById("upazila").value;
    const unionSelect = document.getElementById("union");
    unionSelect.innerHTML = '<option value="">ইউনিয়ন সিলেক্ট করুন</option>';
    if (upazila && unionData[upazila]) {
        unionData[upazila].forEach(u => unionSelect.add(new Option(u, u)));
    }
}

function checkSpecialWard() {
    const ward = document.getElementById('ward').value;
    const subAreaBox = document.getElementById('subAreaBox');
    const subAreaSelect = document.getElementById('subArea');
    const areaMap = { "5": ["লুছনি পশ্চিম"], "7": ["মালিয়ানী"] };

    if (areaMap[ward]) {
        subAreaBox.classList.remove('hidden');
        let optionsHtml = `<option value="">নির্বাচন করুন</option>`; 
        optionsHtml += `<option value="সাধারণ">ওয়ার্ড (সাধারণ)</option>`;
        areaMap[ward].forEach(area => {
            optionsHtml += `<option value="${area}">${area}</option>`;
        });
        subAreaSelect.innerHTML = optionsHtml;
        subAreaSelect.value = ""; 
    } else {
        subAreaBox.classList.add('hidden');
        subAreaSelect.innerHTML = ""; 
        subAreaSelect.value = "সাধারণ";
    }
    document.getElementById('live-count-display').innerHTML = "";
}

/**
 * ৭. মূল অনুসন্ধান লজিক
 */
function searchVoter() {
    const searchQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : "";
    if (!searchQuery) { alert("⚠️ তথ্য দিন!"); return; }
    executeGeneralSearch(searchQuery);
}

function executeGeneralSearch(query, secondQuery = null) {
    const union = document.getElementById('union').value;
    const ward = document.getElementById('ward').value;
    const genderSelect = document.getElementById('gender').value;
    const subArea = document.getElementById('subArea').value;
    const resultArea = document.getElementById('resultArea');
    
    if (!union) { alert("⚠️ অনুগ্রহ করে ইউনিয়ন সিলেক্ট করুন!"); return; }

    const specialWards = ["3", "5", "7"];
    if (specialWards.includes(ward) && (subArea === "" || subArea === null)) {
        alert("⚠️ এই ওয়ার্ডের জন্য এলাকা বা মহল্লা নির্বাচন করা বাধ্যতামূলক!");
        return;
    }
    
    resultArea.innerHTML = `<div class='loader-container'><div class='circle-spinner'></div><span>খোঁজা হচ্ছে অপেক্ষা করুন...</span></div>`;
    
        // পাথ তৈরির লজিক পরিবর্তন
    let wardPath = (ward === 'teliani_purbo') ? 'teliani_purbo' : `ward_${ward}`;
    let dbPath = `voters/${union}/${wardPath}`;
    if (subArea && subArea !== "সাধারণ") dbPath += `/${subArea}`;

    
    database.ref(dbPath).once('value').then((snapshot) => {
        resultArea.innerHTML = ""; 
        let found = false;
        const queryBn = enToBn(query);
        const secondQueryBn = secondQuery ? enToBn(secondQuery) : null;

        if (snapshot.exists()) {
            snapshot.forEach((genderNode) => {
                const currentGender = genderNode.key;
                if (genderSelect === "সব" || genderSelect === currentGender) {
                    if (currentGender === "পুরুষ" || currentGender === "নারী") {
                        genderNode.forEach((voterNode) => {
                            const d = voterNode.val();
                            if (!d) return;
                            let isMatch = false;
                            const serialKey = voterNode.key;
                            
                            if (query && secondQuery) {
                                const nameMatch = (d.name && d.name.includes(query));
                                const dobMatch = (d.dob && (d.dob.includes(secondQuery) || d.dob.includes(secondQueryBn)));
                                isMatch = (nameMatch && dobMatch);
                            } else {
                                if (currentSearchMode === 'serial') {
                                    isMatch = (parseToNum(serialKey) === parseToNum(query));
                                } else if (currentSearchMode === 'name') {
                                    isMatch = (d.name && d.name.includes(query));
                                } else if (currentSearchMode === 'dob') {
                                    isMatch = (d.dob && (d.dob.includes(query) || d.dob.includes(queryBn)));
                                }
                            }
                            
                            if (isMatch) {
                                found = true;
                                const displaySerial = formatToThreeDigitBn(parseToNum(serialKey));
                                resultArea.innerHTML += `
                                    <div class="voter-card animated fadeIn">
                                        <span class="name-tag">${displaySerial}. ${d.name}</span>
                                        <div class="info-grid">
                                            <div class="info-item"><b>আইডি:</b> ${d.voter_id || 'N/A'}</div>
                                            <div class="info-item"><b>জন্ম তারিখ:</b> ${d.dob || 'N/A'}</div>
                                            <div class="info-item"><b>পিতা:</b> ${d.father || 'N/A'}</div>
                                            <div class="info-item"><b>মাতা:</b> ${d.mother || 'N/A'}</div>
                                        </div>
                                    </div>`;
                            }
                        });
                    }
                }
            });
        }
        
        if (found) {
            if (typeof playSuccessSound === 'function') playSuccessSound();
            speakStatus("আপনার ভোটার তথ্য পাওয়া গেছে");
        } else {
            speakStatus("দুঃখিত, কোনো তথ্য মেলেনি");
            resultArea.innerHTML = `<div style="text-align:center; padding: 30px; background: #fff5f5; border-radius: 12px; border: 1px solid #feb2b2; margin-top: 20px;"><p style="color: #c53030; font-weight: bold; margin-bottom: 5px;">দুঃখিত!</p><span style="color: #742a2a;">তথ্য মেলেনি। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।</span></div>`;
        }
    }).catch((error) => {
        speakStatus("সার্ভার ত্রুটি");
        resultArea.innerHTML = `<div style="color: #c53030; text-align:center; padding: 20px;">⚠️ সার্ভার ত্রুটি!</div>`;
    });
}

/**
 * ৮. অডিও ও ভয়েস ফিডব্যাক
 */
function speakStatus(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'bn-BD';
        utterance.pitch = 1.0;
        utterance.rate = 1.1; 
        window.speechSynthesis.speak(utterance);
    }
}

function playSuccessSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1020, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) { console.log("Sound error"); }
}

/**
 * ৯. বারকোড স্ক্যানার লজিক
 */
const html5QrCode = new Html5Qrcode("reader");
const qrInputFile = document.getElementById('qr-input-file');

function startScanner() {
    history.pushState({ page: 'scanner' }, "Scanner", "");
    currentSearchMode = 'dob';
    closeNav();
    const statsCard = document.getElementById('home-stats-card');
    if (statsCard) statsCard.classList.add('hidden');
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('search-section').classList.remove('hidden');
    document.getElementById('scanner-wrapper').classList.remove('hidden');
    document.getElementById('work-in-progress').style.display = 'none';
    document.getElementById('search-title').innerText = "NID বারকোড স্ক্যান করুন";
    document.getElementById('dynamic-input-area').classList.add('hidden'); 
    document.getElementById('input-label').classList.add('hidden'); 
    const homeStatsArea = document.getElementById('home-union-stats-area');
    if (homeStatsArea) homeStatsArea.style.display = 'none';
    const searchBtn = document.querySelector('button[onclick="searchVoter()"]');
    if (searchBtn) searchBtn.style.display = "none";
}

if (qrInputFile) {
    qrInputFile.addEventListener('change', e => {
        if (e.target.files.length === 0) return;
        const imageFile = e.target.files[0];
        const resultArea = document.getElementById('resultArea');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        resultArea.innerHTML = `<div class='loader-container'><div class='circle-spinner'></div><span>বারকোড পড়া হচ্ছে...</span></div>`;
        loadingSpinner.classList.remove('hidden');

        html5QrCode.scanFile(imageFile, true)
            .then(decodedText => {
                loadingSpinner.classList.add('hidden');
                processBarcodeData(decodedText);
            })
            .catch(err => {
                loadingSpinner.classList.add('hidden');
                resultArea.innerHTML = "<div style='color:red; text-align:center;'>❌ বারকোড পড়া যায়নি! আবার চেষ্টা করুন।</div>";
            });
    });
}

async function fetchVotersForSuggestion() {
    const union = document.getElementById('union')?.value;
    const ward = document.getElementById('ward')?.value;
    const subArea = document.getElementById('subArea')?.value;
    const genderSelect = document.getElementById('gender')?.value;

    if (!union || !ward) return;
    
    let wardPath = (ward === 'teliani_purbo') ? 'teliani_purbo' : `ward_${ward}`;
    let dbPath = `voters/${union}/${wardPath}`;
    if (subArea && subArea !== "সাধারণ") dbPath += `/${subArea}`;

    try {
        const snapshot = await database.ref(dbPath).once('value');
        localVoterList = []; 
        if (snapshot.exists()) {
            snapshot.forEach(genderNode => {
                const currentGender = genderNode.key;
                if (genderSelect === "সব" || genderSelect === currentGender) {
                    if (currentGender === "পুরুষ" || currentGender === "নারী") {
                        genderNode.forEach(voterNode => {
                            const data = voterNode.val();
                            if (data && data.name) localVoterList.push(data.name);
                        });
                    }
                }
            });
        }
    } catch (e) { console.error("Suggestion loading failed:", e); }
}

/**
 * ১২. রিয়েল-টাইম পরিসংখ্যান লজিক
 */
function updateLiveCount() {
    const union = document.getElementById('union').value;
    const ward = document.getElementById('ward').value;
    const genderSelect = document.getElementById('gender').value;
    const subArea = document.getElementById('subArea').value;
    const countDisplay = document.getElementById('live-count-display');

    if (!union) { countDisplay.innerHTML = ""; return; }
    if ((ward === "5" || ward === "7") && subArea === "") {
        countDisplay.innerHTML = "<small style='color: #e67e22;'>মহল্লা বা এলাকা নির্বাচন করুন...</small>";
        return;
    }

    countDisplay.innerHTML = "<small style='color: #666;'>ভোটার সংখ্যা গণনা হচ্ছে...</small>";
    
    let wardPath = (ward === 'teliani_purbo') ? 'teliani_purbo' : `ward_${ward}`;
    let dbPath = `voters/${union}/${wardPath}`;
    if (subArea && subArea !== "সাধারণ") dbPath += `/${subArea}`;

    database.ref(dbPath).once('value', (snapshot) => {
        let totalCount = 0;
        if (snapshot.exists()) {
            snapshot.forEach((genderNode) => {
                if (genderSelect === "সব" || genderNode.key === genderSelect) {
                    if (typeof genderNode.val() === 'object' && !["লুছনি পশ্চিম", "মালিয়ানী", "কুটির চর"].includes(genderNode.key)) {
                         totalCount += genderNode.numChildren();
                    }
                }
            });
        }
        if (totalCount > 0) {
            let labelText = (genderSelect === "সব") ? "মোট ভোটার" : `মোট ${genderSelect} ভোটার`;
            countDisplay.innerHTML = `<div style="display: inline-block; background: #e8f5e9; border: 1px solid #2e7d32; padding: 6px 18px; border-radius: 50px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><span style="color: #004529; font-size: 14px; font-weight: bold;">${labelText}: <span style="color: #d32f2f; font-size: 17px;">${enToBn(totalCount.toString())}</span> জন</span></div>`;
        } else {
            countDisplay.innerHTML = "<span style='color: #d32f2f; font-size: 13px;'>⚠️ তথ্য পাওয়া যায়নি।</span>";
        }
    });
}

async function loadHomeStats() {
    const union = document.getElementById('home-union-select').value;
    const statsCard = document.getElementById('home-stats-card');
    const wardGrid = document.getElementById('home-ward-grid');
    const totalDisplay = document.getElementById('home-total-count');
    const loader = document.getElementById('home-loader');

    if (!union) { statsCard.classList.add('hidden'); return; }

    statsCard.classList.remove('hidden');
    wardGrid.innerHTML = "";
    totalDisplay.innerHTML = "";
    loader.style.display = "block";

    let totalUnionVoters = 0;
    const wardPromises = [];
    // ১-৯ ওয়ার্ডের জন্য প্রমিস
    for (let i = 1; i <= 9; i++) wardPromises.push(database.ref(`voters/${union}/ward_${i}`).once('value'));
    // তেলিয়ানী (পূর্ব) এর জন্য আলাদা প্রমিস যোগ করা হলো
    wardPromises.push(database.ref(`voters/${union}/teliani_purbo`).once('value'));

    try {
        const snapshots = await Promise.all(wardPromises);
        loader.style.display = "none";
        
        snapshots.forEach((snapshot, index) => {
            let label = "";
            if (index < 9) {
                label = `ওয়ার্ড ${enToBn((index + 1).toString())}`;
            } else {
                label = "তেলিয়ানী (পূর্ব)";
            }

            let wardGeneralCount = 0;
            let subAreaTotal = 0;
            let subAreaDetailsHTML = ""; 

            if (snapshot.exists()) {
                snapshot.forEach(node => {
                    if (node.key !== "পুরুষ" && node.key !== "নারী") {
                        let currentSubAreaCount = 0;
                        node.forEach(genderNode => { currentSubAreaCount += genderNode.numChildren(); });
                        subAreaTotal += currentSubAreaCount;
                        subAreaDetailsHTML += `<br><small style="color:#e67e22; font-size:10px;">(${node.key}: ${enToBn(currentSubAreaCount.toString())})</small>`;
                    } else { wardGeneralCount += node.numChildren(); }
                });
            }
            
            let finalWardTotal = wardGeneralCount + subAreaTotal;
            totalUnionVoters += finalWardTotal;

            // আপনার আগের বক্সের ডিজাইন সেম রাখা হয়েছে
            const wardBox = document.createElement('div');
            wardBox.style = "background: #f1f8f5; padding: 10px; border-radius: 8px; border: 1px solid #0CFF17; text-align: center; min-height: 60px; display: flex; flex-direction: column; justify-content: center;";
            wardBox.innerHTML = `<span style="font-size: 12px; color: #666;">${label}</span><b style="color: #004529; font-size: 15px;">${enToBn(finalWardTotal.toString())} জন</b>${subAreaDetailsHTML}`;
            wardGrid.appendChild(wardBox);
        });
        
        totalDisplay.innerHTML = `<div style="margin-top: 10px;"><span class="total-voter-font" style="font-size: 18px; font-weight: bold; color: #000;">সর্বমোট ভোটার: <span style="color: #d32f2f;">${enToBn(totalUnionVoters.toString())}</span> জন</span></div>`;
    } catch (error) { 
        loader.innerHTML = "<span style='color:red;'>তথ্য লোড করতে সমস্যা হয়েছে!</span>"; 
    }
}


/**
 * ১৩. অতিরিক্ত ইউজার ইন্টারফেস ফাংশন
 */
function toggleInstruction() {
    const content = document.getElementById('instruction-content');
    const arrow = document.getElementById('instruction-arrow');
    if (content.style.display === "none") {
        content.style.display = "block";
        arrow.style.transform = "rotate(180deg)";
    } else {
        content.style.display = "none";
        arrow.style.transform = "rotate(0deg)";
    }
}

function showDeveloperModal() { closeNav(); document.getElementById('dev-modal').classList.remove('hidden'); }
function closeDevModal() { document.getElementById('dev-modal').classList.add('hidden'); }

function toggleDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'ভোটার পোর্টাল অ্যাপ',
            text: 'সহজেই ভোটার তথ্য অনুসন্ধান এবং এনআইডি স্ক্যান করতে এই অ্যাপটি ব্যবহার করুন।',
            url: window.location.href
        });
    } else { alert("লিংকটি কপি করে শেয়ার করুন: " + window.location.href); }
}

// ১. গ্লোবাল স্টেট এবং সেফটি ভেরিয়েবল
let isAtHome = true;

/**
 * ২. হিস্ট্রি কন্ট্রোল ফাংশন
 * এটি ব্রাউজারের হিস্ট্রিতে একটি নকল 'লেয়ার' তৈরি করে যাতে ব্যাক বাটন চাপলে অ্যাপ বন্ধ না হয়
 */
function pushSafetyState() {
    if (history.state?.page !== 'exit_layer') {
        history.pushState({ page: 'exit_layer' }, "", "");
    }
}

/**
 * ৩. ইউজার অ্যাক্টিভিটি ডিটেকশন
 * ব্রাউজার সিকিউরিটির কারণে ইউজার স্ক্রিনে টাচ বা স্ক্রল না করলে হিস্ট্রি পুশ কাজ করে না।
 * তাই ইউজার ইন্টারঅ্যাক্ট করলেই আমরা সেফটি লেয়ারটি চালু করে দিই।
 */
['touchstart', 'scroll', 'mousedown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => {
        if (!history.state) {
            history.replaceState({ page: 'home' }, "", "");
            pushSafetyState();
        }
    }, { once: true });
});

/**
 * ৪. মেইন ব্যাক বাটন লজিক (PopState Handler)
 */
window.onpopstate = function(event) {
    const modal = document.getElementById('exit-modal');
    const searchSection = document.getElementById('search-section');
    const isSearchVisible = searchSection && !searchSection.classList.contains('hidden');

    // কন্ডিশন ১: যদি এক্সিট মোডালটি এখন স্ক্রিনে খোলা থাকে
    if (modal && modal.style.display === 'flex') {
        closeExitModal();
        pushSafetyState(); // পুনরায় ব্যাক বাটন প্রটেকশন চালু করা
        return;
    }

    // কন্ডিশন ২: যদি ইউজার কোনো সার্চ পেজে থাকে
    if (isSearchVisible) {
        goToHome(); // হোমে ফিরে যাওয়ার ফাংশন কল
        pushSafetyState(); // পুনরায় ব্যাক বাটন প্রটেকশন চালু করা
    } 
    // কন্ডিশন ৩: ইউজার যদি মেইন হোম স্ক্রিনে থাকে
    else {
        exitApp(); // এক্সিট মোডাল দেখানো
        pushSafetyState(); // যাতে পরের বার ব্যাক চাপলে মোডাল বন্ধ হয় (অ্যাপ থেকে বের না হয়)
    }
};

/**
 * ৫. এক্সিট মোডাল নিয়ন্ত্রণ ফাংশনসমূহ
 */
function exitApp() {
    // সাইড মেনু খোলা থাকলে বন্ধ করা (যদি ফাংশনটি থাকে)
    if (typeof closeNav === "function") closeNav();

    const modal = document.getElementById('exit-modal');
    if (modal) {
        modal.style.display = 'flex'; // মোডাল দেখানো
        modal.classList.remove('hidden');
    }
}

function closeExitModal() {
    const modal = document.getElementById('exit-modal');
    if (modal) {
        modal.style.display = 'none'; // মোডাল লুকিয়ে ফেলা
        modal.classList.add('hidden');
    }
}

function confirmExit() {
    // সরাসরি অ্যাপ থেকে বের হয়ে যাওয়া
    window.location.href = "about:blank";
}

/**
 * ৬. অতিরিক্ত সেফটি: যদি goToHome ফাংশনে হিস্ট্রি পুশ না থাকে
 * নিশ্চিত করুন আপনার goToHome ফাংশনটি সার্চ সেকশন হাইড করছে
 */
const originalGoToHome = typeof goToHome === "function" ? goToHome : null;
if (originalGoToHome) {
    goToHome = function() {
        originalGoToHome(); // আগের ফাংশনটি রান করবে
        pushSafetyState();   // ব্যাক বাটন সুরক্ষা নিশ্চিত করবে
    };
}


/**
 * ১৪. ইভেন্ট লিসেনার ও ইনিশিয়ালাইজেশন
 */
document.addEventListener('input', function (e) {
    if (e.target.id === 'searchInput' && currentSearchMode === 'dob') {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
        if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
        e.target.value = val;
    }
});

['union', 'ward', 'subArea', 'gender'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
        localVoterList = []; 
        document.getElementById('suggestion-box')?.classList.add('hidden');
        updateLiveCount();
    });
});

document.addEventListener('click', function(e) {
    const sBox = document.getElementById('suggestion-box');
    const sInput = document.getElementById('searchInput');
    if (sBox && e.target !== sInput && !sBox.contains(e.target)) sBox.classList.add('hidden');
});

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
        if (document.getElementById('dark-mode-toggle')) document.getElementById('dark-mode-toggle').checked = true;
    }
    const homeSelect = document.getElementById('home-union-select');
    if(homeSelect) {
        homeSelect.value = "বামনডাঙ্গা";
        loadHomeStats();
    }
});
/**
 * ব্যবহারের নিয়মাবলী মডাল নিয়ন্ত্রণ
 */

// মডাল দেখানোর ফাংশন
function showInstructions() {
    const modal = document.getElementById('instruction-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // অ্যানিমেশনের জন্য ডিসপ্লে ব্লক করা
        modal.style.display = 'flex';
        // সাইড মেনু খোলা থাকলে তা বন্ধ করে দেওয়া (ভালো ইউজার এক্সপেরিয়েন্সের জন্য)
        if (typeof closeNav === "function") closeNav();
    }
}

// মডাল বন্ধ করার ফাংশন
function closeInstructions() {
    const modal = document.getElementById('instruction-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// মডালের বাইরে ক্লিক করলে মডাল বন্ধ হবে
window.onclick = function(event) {
    const modal = document.getElementById('instruction-modal');
    if (event.target == modal) {
        closeInstructions();
    }
}

function processBarcodeData(data) {
    const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    // আপনার বারকোড ফরম্যাট অনুযায়ী জন্ম তারিখ খোঁজা
    const dobMatch = data.match(/<DOB>(\d{1,2})\s([a-zA-Z]{3})\s(\d{4})<\/DOB>/) || 
                     data.match(/(\d{1,2})\s([a-zA-Z]{3})\s(\d{4})/);

    if (dobMatch) {
        let day = dobMatch[1].padStart(2, '0');
        let monthName = dobMatch[2];
        let year = dobMatch[3];
        
        // মাসকে সংখ্যায় রূপান্তর (যেমন: Apr -> 04)
        let monthNum = monthMap[monthName] || "00";
        
        const fullDob = `${day}/${monthNum}/${year}`; 
        
        if (typeof playSuccessSound === 'function') playSuccessSound();
        executeGeneralSearch(fullDob);
    } else {
        // বিকল্প ফরম্যাট চেক (YYYY-MM-DD বা YYYYMMDD)
        const altMatch = data.match(/(\d{4})-(\d{2})-(\d{2})/) || data.match(/(\d{4})(\d{2})(\d{2})/);
        
        if (altMatch) {
            const formattedDob = `${altMatch[3]}/${altMatch[2]}/${altMatch[1]}`;
            executeGeneralSearch(formattedDob);
        } else {
            alert("⚠️ বারকোডে সঠিক জন্ম তারিখ খুঁজে পাওয়া যায়নি।");
        }
    }
}



function selectSuggestion(name) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = name;
        document.getElementById('suggestion-box')?.classList.add('hidden');
        if (typeof searchVoter === "function") searchVoter(); 
        else executeGeneralSearch(name);
    }
}


async function handleNameInput(val) {
    const suggestionBox = document.getElementById('suggestion-box');
    if (!suggestionBox) return;

    // যদি মোড 'name' না হয় বা ২টির কম অক্ষর থাকে তবে বক্স বন্ধ করো
    if (currentSearchMode !== 'name' || val.trim().length < 2) {
        suggestionBox.classList.add('hidden');
        return;
    }

    // যদি মেমোরিতে ডাটা না থাকে তবে ডাটাবেস থেকে ফেচ করো
    if (localVoterList.length === 0) {
        await fetchVotersForSuggestion();
    }
    
    const query = val.toLowerCase();
    // ডুপ্লিকেট নাম বাদ দিতে Set ব্যবহার করা হয়েছে
    const uniqueNames = [...new Set(localVoterList)];
    
    const filtered = uniqueNames.filter(name => 
        name.toLowerCase().includes(query)
    ).slice(0, 10); 

    if (filtered.length > 0) {
        suggestionBox.innerHTML = filtered.map(name => 
            `<div class="suggestion-item" onclick="selectSuggestion('${name.replace(/'/g, "\\'")}')">
                <i class="fa fa-user-o"></i> ${name}
            </div>`
        ).join('');
        suggestionBox.classList.remove('hidden');
    } else {
        suggestionBox.classList.add('hidden');
    }
}


