// optgroup用：地方 → 都道府県の定義は構造として残します
const regions = {
  "北海道・東北": ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  "近畿": ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
};

// 読み込んだ最低賃金データを保持する変数
let currentMinWageData = {};

// 外部ファイル（txt/csv）を読み込んで解析する関数
async function loadMinWageData(year) {
  try {
    const response = await fetch(`minwage-${year}.txt`);
    if (!response.ok) {
      throw new Error(`minwage-${year}.txt の読み込みに失敗しました。`);
    }
    const text = await response.text();
    parseCSV(text);
    return true;
  } catch (error) {
    console.error(error);
    document.getElementById("result").innerHTML = `<p style="color:red;">データの読み込みに失敗しました。（サーバー環境で実行していますか？）</p>`;
    return false;
  }
}

// カンマ区切りのテキストをオブジェクトに変換
function parseCSV(text) {
  currentMinWageData = {};
  const lines = text.trim().split("\n");
  
  for (let i = 1; i < lines.length; i++) { // 1行目はヘッダーとして飛ばす
    const line = lines[i].trim();
    if (!line) continue;
    
    const [pref, wage] = line.split(",");
    if (pref && wage) {
      currentMinWageData[pref.trim()] = Number(wage.trim());
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const prefSelect = document.getElementById("pref");
  const yearSelect = document.getElementById("year");

  // optgroupを追加
  Object.keys(regions).forEach(regionName => {
    const group = document.createElement("optgroup");
    group.label = regionName;

    regions[regionName].forEach(pref => {
      const option = document.createElement("option");
      option.value = pref;
      option.textContent = pref;
      group.appendChild(option);
    });

    prefSelect.appendChild(group);
  });

  // 初回のデータ読み込み（2026年）
  await loadMinWageData(yearSelect.value);

  // 年度が変更されたらデータを再読み込み
  yearSelect.addEventListener("change", async (e) => {
    await loadMinWageData(e.target.value);
    document.getElementById("result").innerHTML = ""; // 結果表示をリセット
  });
});

document.getElementById("calcButton").addEventListener("click", () => {
  const pref = document.getElementById("pref").value;
  const myWage = Number(document.getElementById("wage").value);
  const yearSelect = document.getElementById("year");
  const selectedYearText = yearSelect.options[yearSelect.selectedIndex].text;
  const result = document.getElementById("result");

  result.style.color = "";
  result.innerHTML = "";

  if (!pref) {
    result.textContent = "都道府県を選択してください。";
    return;
  }

  if (!myWage || myWage <= 0) {
    result.textContent = "有効な時給を入力してください。";
    return;
  }

  const base = currentMinWageData[pref];
  if (!base) {
    result.textContent = "この都道府県・年度の最低賃金データが見つかりません。";
    return;
  }

  const factsHtml =
    `<p>入力された時給：${myWage}円</p>` +
    `<p>${pref}の最低賃金（${selectedYearText}）：${base}円</p>`;

  let conclusion = "";
  if (myWage >= base) {
    const percentUp = ((myWage - base) / base) * 100;
    conclusion = `<p>あなたの時給は、${pref}の最低賃金の<strong>${percentUp.toFixed(2)}％</strong>増しの金額です。</p>`;
  } else {
    result.style.color = "red";
    conclusion = `<p>あなたの時給は、${pref}の最低賃金を下回っています。</p>`;
  }

  const note =
    `<p style="margin-top:12px;font-size:0.9em;color:#555;">` +
    `※金額は${selectedYearText}のデータに基づきます。<br>` +
    `※データが改定された場合は、対応する年度のテキストファイルを更新してください。` +
    `</p>`;

  result.innerHTML = `<p><strong>【結果】</strong></p>` + factsHtml + conclusion + note;
});