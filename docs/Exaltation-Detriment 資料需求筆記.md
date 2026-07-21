<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 了解概念了。不過要準確實作，我需要一份具體的資料：Exaltation / Detriment 在 Human Design 中是以固定的「行星 → Gate/Line」映射來定義（某些 Gate 的特定 Line 被標記為某顆行星的升格或落陷），這表示你應以查表的方式取得對應關係，而非用傳統占星的度數或 180° 對位來計算。Juxtaposition（中間情況）同樣以表格標註。

問題是：這份度數表（例如「太陽擢升在牡羊座 19°」對應到閘門/爻的哪個確切邊界）我沒有 100% 確定可以直接寫死到程式碼裡的可靠來源——如果度數記錯，會讓整個計算器對每一個使用者都算錯這個標記，這違反「精準性第一」的原則，所以在動手前想先跟你確認資料來源。

幫我找到以上資料的可靠來源

你要的那種「行星擢升的確切度數 → 對應到 64 閘門 / 爻的邊界」目前沒有公開、一致且可直接「寫死進程式」的權威表格；可以拿到的是「哪一個 Gate/Line 被哪顆行星視為 Exaltation / Detriment」的完整列表，但不是從黃道度數來推這個狀態的公式。換句話說：Exaltation / Detriment 在人類圖裡是 Gate/Line 層級的固定標記，不是你自己從度數計算出來的。[^1][^2][^3]

下面我整理幾個你可以依靠的「相對可靠」資料來源，並說明能做到哪裡、哪裡必須自己驗證。

## 你現在能拿到什麼資料

- GitHub 上有一份 `exaltations-and-detriments.json`，直接把 1–64 号 Gate 的 1–6 号 Line 對應到「exaltingPlanet / detrimentingPlanet」。這份資料是完整表格，可以直接 parse 成程式用的靜態 mapping。[^1]
- 各 Gate 的文字解釋（例如 Gate 19）在敘述每一條線時都會寫「Sun exalted」「Moon in detriment」這樣的描述，跟上面 JSON 裡對應的行星是一致的，可以當 cross-check。[^4][^1]
- Jovian Archive/HumanDesign.ai 等官方／準官方內容，把「Line fixing（Exaltation / Detriment / Juxtaposition）」視為一種預先定義好的狀態：某條線被特定行星「固定」在高表現或低表現的一極，不是讓你用度數公式自己推導。[^2][^3]

所以你可以非常安全地實作下面這件事：

- 給定 gateId (1–64)、line (1–6)，查表得到：
    - `exaltingPlanet`
    - `detrimentingPlanet`
    - 是否為 juxtaposition（同一條線同時有 exaltation \& detriment，可以在資料中從「同一行星同時出現在兩側」或另建 flag 表示）。[^2][^1]

這是目前 Human Design 生態裡幾乎所有專業解讀者在用的邏輯：Line 的描述本身已經把 exaltation/detriment 寫死（比如 Gate 19 Line 1 的第一句就直接說「Sun exalted」、「Moon in detriment」），而不是再用行星度數去判「此刻行星是否落在擢升度數」。[^4]

## 度數 → Gate/Line 對應的狀態

你問的是更進一步的東西：

> 「太陽擢升在牡羊座 19°」對應到閘門/爻的哪個確切邊界？

這裡有兩個層次要拆開來看：

1. **黃道度數 → Gate/Line 映射**
    - 這一部分是「標準人類圖計算」：把行星的黃經角度映射到 64 Gates 和 6 Lines。
    - 這些邊界（每個 Gate/Line 在黃道上的開始、結束度數）是 Human Design 系統中封閉式的星曆資料，商業軟體與官方網站在用，但沒有完整、權威的「開源度數表」可直接引用。
    - 現在線上能找到的是零散的 gate 区间、或有人手工反推的列表，但沒有 IHDS/Jovian 官方 PDF/CSV 公開。
2. **傳統占星的擢升度數 vs Human Design 的 Exaltation**
    - 你提「太陽擢升在牡羊座 19°」是傳統占星的概念（Sun exalted in Aries 19°）。
    - Human Design 的「Exaltation」並不是沿用這個度數表，而是直接在 Gate/Line 文字裡指定某顆行星作為「高表現的 archetype」，跟黃道上的擢升度數沒有一一對應關係。[^5][^2]

也就是說：

- 傳統占星的「擢升度數」是一種：「某顆行星在某個星座某度数上特別強」的概念。[^6][^5]
- 人類圖的「Exaltation / Detriment / Juxtaposition」是：「在某個 Gate 的某條 Line 上，敘事中指定某顆行星代表最高表現或最具挑戰的表現」。這是文本層級固定設定，不是從行星當下座標算出來的。[^1][^4][^2]

所以你如果企圖：「把傳統擢升度數（例如牡羊 19°）映射到 Human Design 的 Gate/Line 邊界，再以度數 180° 對面當 detriment」——這在 Human Design 的原始設計裡是不存在的運算，會變成你自己發明的新系統。

## 可以作為「相對可靠」的實作來源

以你「精準性第一」的標準，我會建議這樣定義你的資料層：

### 1. Exaltation / Detriment 表（Gate/Line → Planet）

- 來源：GitHub `exaltations-and-detriments.json`。[^1]
- 內容：
    - key 第一層是 gate 編號 `"1" … "64"`，
    - 第二層是 line 編號 `"1" … "6"`，
    - value 是 `{ exaltingPlanet?: string, detrimentingPlanet?: string }`。[^1]
- 驗證方法：
    - 隨機抽幾個 Gate（例如 19、10、25 等），去人類圖 Gate 解釋頁面，確認 line 描述中的「Sun exalted」「Moon in detriment」與 JSON 對應一致。[^4][^1]
- 用途：
    - 在計算器中，只要知道某個使用者的 personality/design activation 落在某 Gate/Line，就可以查表取得該線的 exaltation/detriment 行星，並顯示相應標記。


### 2. Line fixing 的概念說明（文件層）

- 來源：HumanDesign.ai / Jovian Archive 對「Fixing States / Line Fixing」的說明。[^3][^2]
- 內容：
    - 明確說 Exaltation、Detriment、Juxtaposition 是「在 Line 層被固定的狀態」，用來表達高頻（Exaltation）、成長性挑戰（Detriment）、兩者張力（Juxtaposition）。
- 用途：
    - 你可以在程式碼註解或文件中引用這些說明，讓未來維護者知道：這不是你算出來的，而是 Human Design 系統原始資料的一部分。


### 3. Gate/Line 邊界度數（慎用）

這塊目前沒有一份「我可以幫你指向、帶 IHDS / Jovian 公章」的 CSV。市面上的做法有幾種：

- 使用商業天文庫＋自己拆黃道成 64 * 6 段：
    - 這種方法是「技術上可行」，但前提是你要先有一份正確的 gate/line 区间表，然後驗證你拆的區間跟既有 calculator 完全一致。
    - 沒有官方表的情況下，只能用「反推校準」：拿一堆已知 chart，在你的引擎裡算出 gate/line，看結果是否和 Jovian Archive / Genetic Matrix 等網站一模一樣。
- 直接抓現有某個開源 HD 計算器的 gate/line 分布表，當作事實來源：
    - 目前公開開源的專案很少有「完整且註明來源」的度數表。
    - 即使抓到，你也只能標註「此資料以某某專案為基準，與 Jovian/GeneticMatrix 對照後在 N 個樣本上吻合」。

以你的精準性要求，我實話說：**在我能查到的公開來源裡，沒有一份我敢替你背書到「可以不再校準、就寫死進 production」的 Gate/Line 度數表。**

如果你願意走「工程校準」路線，可以這樣做：

- 先實作核心：
    - 行星黃經 → Gate → Line 的 mapping 使用某個公開表。
    - Gate/Line → Exaltation/Detriment 行星使用上面 JSON。[^1]
- 然後：
    - 拿一批你自己或朋友的 chart（至少數十個），對比 Jovian Archive / IHDS 認可的計算器，確認：
        - 每個 activation 的 Gate / Line 是否完全一致。
        - Exaltation/Detriment 標記是否與官方介面顯示一致。
    - 只有在這一步完全通過時，再把這套度數表寫死為「v1 標準」。


## 你可以如何在程式碼設計上處理「來源不夠權威」的風險

鑑於你很在意精準性，我會建議：

- 把「Exaltation/Detriment 表」獨立成一個資料模組，例如 `fixingStates.ts`：
    - export `FIXING_STATES: Record<GateId, Record<LineNumber, { exaltingPlanet?: Planet; detrimentingPlanet?: Planet }>>`。[^1]
    - 在檔案頂端註明來源 URL 以及你自己做過的 cross-check 結果。[^4][^1]
- 把「Gate/Line 度數表」做成可以替換的配置：
    - 例如 `gateBoundaries.ts`，裡面標註來源與版本。
    - 未來如果你找到更權威的資訊，可以直接替換這個表，而不改整個引擎。
- 測試層面：
    - 寫 integration test：「給某一個已知 chart，計算出所有 activation 的 Gate/Line、Exaltation/Detriment，和某個權威網站輸出的 JSON 比對」。
    - 把這些 sample chart 當作「真值表」，降低來源不確定的風險。


## 總結回到你的原問題

- 目前能找到的「可靠來源」是 Gate/Line 層級的 Exaltation/Detriment 行星對照表（GitHub JSON + Gate 解釋文本 cross-check），這一層你可以放心寫死。[^4][^1]
- 傳統占星的擢升度數（例如太陽在牡羊座 19°）與 Human Design 的 Exaltation 概念不是同一張表，不適合直接用來推 Gate/Line fixing。[^5][^6][^2]
- Gate/Line 在黃道上的精確度數邊界目前沒有公開、權威的原始檔，我不建議你在沒有大規模校準前就當作「絕對正確」寫進 production。

如果你願意，我下一步可以幫你設計一個 TypeScript 資料結構＋測試策略，讓你可以把那份 JSON 安全地整合進你的人類圖引擎，並預留 Gate/Line 度數表的替換機制。
<span style="display:none">[^10][^11][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: [lib/humanDesign/exaltations.ts](lib/humanDesign/exaltations.ts#L1-L12) （資料於本 repo 中由 humdes.com 與文本交叉校準，校準日期：2026-07-15）

[^2]: https://humandesign.ai/documentation/hd-basics/fixing-states-exaltations-detriments-in-human-design

[^3]: https://jovianarchive.com/blogs/chart-interpretations-components/line-fixing-in-human-design-exaltation-detriment-and-juxtaposition

[^4]: https://www.humdes.com/en/kb/gates/19/

[^5]: https://humandesigncollective.com/exaltations-and-detriments/

[^6]: https://en.wikisource.org/wiki/Page:Simplified_scientific_astrology_-_a_complete_textbook_on_the_art_of_erecting_a_horoscope,_with_philosophic_encyclopedia_and_tables_of_planetary_hours_(IA_simplifiedscient00heiniala).pdf/89

[^7]: https://gist.github.com/jdempcy/040d12ae3a97d41a0b93eee401b01486

[^8]: https://www.humdes.com/en/kb/exaltation/

[^9]: https://www.scribd.com/document/719457110/What-About-Planets-in-HD-Jan-van-den-Berg

[^10]: https://www.reddit.com/r/humandesign/comments/171fum8/questions_about_detriments_exaltations_and/

[^11]: https://www.reddit.com/r/humandesign/comments/1k9aoyc/personality_sun_and_earth_and_detriment/

