 // --- Firebase কনফিগারেশন ---
    const firebaseConfig = {
        apiKey: "AIzaSyAzGK_y9kx5oVFL1-rGTnSDxDvdYoVIqOg",
        authDomain: "bmkf-donation-system.firebaseapp.com",
        databaseURL: "https://bmkf-donation-system-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "bmkf-donation-system",
        storageBucket: "bmkf-donation-system.firebasestorage.app",
        messagingSenderId: "718912081844",
        appId: "1:718912081844:web:98d102b1a6dc07464cace1"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    
    // ইউনিয়ন ডাটা লিস্ট
    const unionData = {
        "ভূরুঙ্গামারী": ["পাথরডুবি", "শিলখুড়ি", "তিলাই", "পাইকেরছড়া", "ভূরুঙ্গামারী", "জয়মনিরহাট", "আন্ধারীঝাড়", "বলদিয়া", "চর-ভূরুঙ্গামারী", "বঙ্গঁসোনাহাট"],
        "নাগেশ্বরী": ["নাগেশ্বরী পৌরসভা", "রামখানা", "রায়গঞ্জ", "বামনডাঙ্গা", "বেরুবাড়ী", "সন্তোষপুর", "নেওয়াশী", "হাসনাবাদ", "ভিতরবন্দ", "কালীগঞ্জ", "নুনখাওয়া", "নারায়নপুর", "বল্লোভেরখাস", "কেদার", "কঁচাকাঁটা"]
    };
    
    // ডাইনামিক সাব-এরিয়া ম্যাপ (এখানে নতুন ইউনিয়ন/ওয়ার্ড যোগ করতে পারবেন)
    const areaMap = {
        "বামনডাঙ্গা": {
            "5": ["লুছনি পশ্চিম"],
            "7": ["মালিয়ানী"]
        }
        //"পাথরডুবি": {
           // "1": ["অন্য এলাকা"]
        //}
    };
    
    // --- ইউটিলিটি ফাংশন ---
    function bnToEn(str) { return str.toString().replace(/[০-৯]/g, m => "0123456789" ["০১২৩৪৫৬৭৮৯".indexOf(m)]); }
    
    function enToBn(str) { return str.toString().replace(/[0-9]/g, m => "০১২৩৪৫৬৭৮৯" [m]); }
    
    // ইউনিয়ন ড্রপডাউন আপডেট
    function updateUnions() {
        const upazila = document.getElementById("upazila").value;
        const unionSelect = document.getElementById("union");
        unionSelect.innerHTML = '<option value="">ইউনিয়ন</option>';
        if (upazila) {
            unionData[upazila].forEach(u => unionSelect.add(new Option(u, u)));
        }
    }
    
    // বিশেষ মহল্লা/সাব-এরিয়া চেক
    function checkSpecialWard() {
        const union = document.getElementById("union").value;
        const ward = document.getElementById("ward").value;
        const subAreaBox = document.getElementById("subAreaBox");
        const subAreaSelect = document.getElementById("subArea");
        
        if (areaMap[union] && areaMap[union][ward]) {
            subAreaBox.style.display = "block";
            let optionsHtml = `<option value="সাধারণ">ওয়ার্ড (সাধারণ)</option>`;
            areaMap[union][ward].forEach(area => {
                optionsHtml += `<option value="${area}">${area}</option>`;
            });
            subAreaSelect.innerHTML = optionsHtml;
        } else {
            subAreaBox.style.display = "none";
            subAreaSelect.innerHTML = `<option value="সাধারণ">সাধারণ</option>`;
            subAreaSelect.value = "সাধারণ";
        }
    }
    
    // ইনপুট ক্লিয়ার করা
    function clearInputs() {
        ['name', 'voter_id', 'father', 'mother', 'dob', 'address'].forEach(id => {
            document.getElementById(id).value = "";
        });
        document.getElementById('name').focus();
    }
    
    // অটো ইনক্রিমেন্ট সিরিয়াল
    function autoIncrement(input) {
        let val = bnToEn(input.value);
        let num = parseInt(val, 10);
        if (!isNaN(num)) {
            let next = (num + 1).toString().padStart(val.length, '0');
            input.value = /[০-৯]/.test(input.value) ? enToBn(next) : next;
        }
    }
    
    // --- ১. সিঙ্গেল এন্ট্রি সেভ ---
    function saveSingleEntry() {
        const btn = document.getElementById('saveBtn');
        const status = document.getElementById('status');
        const serialInput = document.getElementById('serial');
        
        const union = document.getElementById('union').value;
        const ward = document.getElementById('ward').value;
        const gender = document.getElementById('gender').value;
        const subArea = document.getElementById('subArea').value;
        const serial = serialInput.value.trim();
        
        if (!union || !serial || !document.getElementById('name').value) {
            alert("ইউনিয়ন, সিরিয়াল এবং নাম অবশ্যই দিন!");
            return;
        }
        
        const data = {
            serial: serial,
            name: document.getElementById('name').value.trim(),
            voter_id: document.getElementById('voter_id').value.trim(),
            father: document.getElementById('father').value.trim(),
            mother: document.getElementById('mother').value.trim(),
            dob: document.getElementById('dob').value.trim(),
            address: document.getElementById('address').value.trim(),
            gender: gender
        };
        
        btn.disabled = true;
        status.innerText = "সেভ হচ্ছে...";
        
        let enSerial = bnToEn(serial).padStart(4, '0');
        let path = `voters/${union}/ward_${ward}`;
        
        if (subArea !== "সাধারণ" && subArea !== "") {
            path += `/${subArea}/${gender}/${enSerial}`;
        } else {
            path += `/${gender}/${enSerial}`;
        }
        
        database.ref(path).set(data).then(() => {
            status.innerText = "✅ সফল: " + serial;
            autoIncrement(serialInput);
            clearInputs();
            btn.disabled = false;
        }).catch((err) => {
            console.error(err);
            status.innerText = "❌ ভুল হয়েছে!";
            btn.disabled = false;
        });
    }
    
    // --- ২. বাল্ক আপলোড লজিক ---
    async function bulkUpload() {
        const bulkInput = document.getElementById('bulkInput').value;
        const union = document.getElementById('union').value;
        const ward = document.getElementById('ward').value;
        const gender = document.getElementById('gender').value;
        const subArea = document.getElementById('subArea').value;
        const status = document.getElementById('status');
        const bulkBtn = document.getElementById('bulkBtn');
        
        if (!union || !bulkInput.trim()) return alert("ইউনিয়ন ও ডাটা নিশ্চিত করুন!");
        
        const cleanInput = bulkInput.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '');
        const blocks = cleanInput.split('---------------------------').map(b => b.trim()).filter(b => b.length > 15);
        
        bulkBtn.disabled = true;
        let count = 0;
        
        for (let block of blocks) {
            let lines = block.split('\n').map(l => l.trim()).filter(l => l !== "");
            let voter = { gender: gender };
            let rawSerial = "";
            
            lines.forEach(line => {
                if (/^[০-৯0-9]+\./.test(line)) {
                    let parts = line.split('.');
                    rawSerial = parts[0].replace(/[^০-৯0-9]/g, '').trim();
                    voter.name = parts.slice(1).join('.').replace('নাম:', '').trim();
                    voter.serial = rawSerial;
                }
                else if (line.includes("ভোটার নং:")) voter.voter_id = line.split("ভোটার নং:")[1].trim();
                else if (line.includes("পিতা:")) voter.father = line.split("পিতা:")[1].trim();
                else if (line.includes("মাতা:")) voter.mother = line.split("মাতা:")[1].trim();
                else if (line.includes("জন্ম তারিখ:")) voter.dob = line.split("জন্ম তারিখ:")[1].trim();
                else if (line.includes("ঠিকানা:")) voter.address = line.split("ঠিকানা:")[1].trim();
            });
            
            if (voter.name && rawSerial) {
                let enSerial = bnToEn(rawSerial).padStart(4, '0');
                let path = `voters/${union}/ward_${ward}`;
                
                if (subArea !== "সাধারণ" && subArea !== "") {
                    path += `/${subArea}/${gender}/${enSerial}`;
                } else {
                    path += `/${gender}/${enSerial}`;
                }
                
                status.innerText = `আপলোড হচ্ছে: ${rawSerial}`;
                try {
                    await database.ref(path).set(voter);
                    count++;
                } catch (e) { console.error(e); }
            }
        }
        
        status.innerText = `✅ মোট ${count} জন সফলভাবে সেভ হয়েছে!`;
        document.getElementById('bulkInput').value = "";
        bulkBtn.disabled = false;
        alert(count + " জন ভোটার যুক্ত হয়েছে।");
    }
    
    // --- ৩. মিসিং সিরিয়াল চেকার ---
    async function checkMissingSerials() {
        const union = document.getElementById('union').value;
        const ward = document.getElementById('ward').value;
        const gender = document.getElementById('gender').value;
        const subArea = document.getElementById('subArea').value;
        const resultArea = document.getElementById('missing-result-area');
        const checkBtn = document.getElementById('checkBtn');
        
        if (!union) return alert("আগে ইউনিয়ন সিলেক্ট করুন!");
        
        checkBtn.disabled = true;
        resultArea.innerHTML = "<div style='text-align:center;'><i class='fas fa-spinner fa-spin'></i> স্ক্যান করা হচ্ছে...</div>";
        
        let path = `voters/${union}/ward_${ward}`;
        if (subArea !== "সাধারণ" && subArea !== "") {
            path += `/${subArea}/${gender}`;
        } else {
            path += `/${gender}`;
        }
        
        try {
            const snapshot = await database.ref(path).once('value');
            if (!snapshot.exists()) {
                resultArea.innerHTML = "<div style='color:red; font-size:13px; text-align:center;'>❌ ডাটা পাওয়া যায়নি!</div>";
                checkBtn.disabled = false;
                return;
            }
            
            let serials = [];
            snapshot.forEach((child) => {
                let s = parseInt(bnToEn(child.key), 10);
                if (!isNaN(s)) serials.push(s);
            });
            
            serials.sort((a, b) => a - b);
            if (serials.length === 0) {
                resultArea.innerHTML = "কোনো সিরিয়াল নম্বর পাওয়া যায়নি।";
                checkBtn.disabled = false;
                return;
            }
            
            let min = serials[0];
            let max = serials[serials.length - 1];
            let missing = [];
            
            for (let i = min; i <= max; i++) {
                if (!serials.includes(i)) {
                    let formatted = i.toString().padStart(min.toString().length > 3 ? 4 : 3, '0');
                    missing.push(enToBn(formatted));
                }
            }
            
            if (missing.length > 0) {
                resultArea.innerHTML = `
                    <div style="background: #fff; border-left: 4px solid #e53e3e; padding: 10px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <strong style="color:#e53e3e; font-size:13px;">⚠️ ${enToBn(min.toString())} থেকে ${enToBn(max.toString())} এর মধ্যে গ্যাপ:</strong>
                        <div style="margin-top:8px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${missing.map(m => `<span style="background:#fed7d7; color:#c53030; padding:2px 6px; border-radius:3px; font-size:12px;">${m}</span>`).join('')}
                        </div>
                        <p style="margin-top:8px; font-size:11px; color:#555;">মোট মিসিং: ${enToBn(missing.length.toString())} টি সিরিয়াল।</p>
                    </div>`;
            } else {
                resultArea.innerHTML = `
                    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px; border-radius: 4px; color: #166534; font-size:13px;">
                        ✅ সিরিয়াল সব ঠিক আছে! (${enToBn(min.toString())} - ${enToBn(max.toString())})
                    </div>`;
            }
        } catch (error) {
            console.error(error);
            resultArea.innerHTML = "ডাটাবেস কানেকশন সমস্যা!";
        }
        checkBtn.disabled = false;
    }
    function validateAdmin() {
        const passInput = document.getElementById('admin-pass').value;
        const errorMsg = document.getElementById('error-msg');
        
        // এখানে আপনার গোপন পাসওয়ার্ড দিন
        if (passInput === "DU9PBxw") { 
            // সঠিক হলে লগইন স্ক্রিন সরিয়ে কন্টেন্ট দেখাবে
            document.getElementById('admin-login-overlay').style.display = "none";
            document.getElementById('admin-content').style.display = "block";
        } else {
            // ভুল হলে এরর মেসেজ দেখাবে
            errorMsg.classList.remove('hidden');
            document.getElementById('admin-pass').value = ""; // বক্স খালি করবে
        }
    }

    // এন্টার বাটন চাপলে যাতে লগইন হয়
    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            validateAdmin();
        }
    });
    
    
    // URL-এ যদি secret=admin123 না থাকে তবে হোমপেজে পাঠিয়ে দেবে
    const urlParams = new URLSearchParams(window.location.search);
    const secretKey = urlParams.get('key');

    if (secretKey !== 'DU9PBxw') { // এখানে আপনার নিজের একটি পাসওয়ার্ড দিন
        window.location.href = "index.html"; 
    }