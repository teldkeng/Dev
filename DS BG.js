Qualtrics.SurveyEngine.addOnload(function () {

    var that = this;

    that.hideNextButton(); // מניעת התקדמות מוקדמת לפני סיום המטלה

    // איתור והסתרת תיבת הטקסט המקורית של Qualtrics (כיור הנתונים)

    var qContainer = that.getQuestionContainer();

    var qualtricsDataSink = qContainer.querySelector('textarea') || qContainer.querySelector('input[type="text"]');

    if (qualtricsDataSink) {

        qualtricsDataSink.style.display = 'none'; // הסתרה מעיני הנבדק

    }



    // רשימות מקודדות קשיח (תואם איפיון פסיכומטרי)

    var sequences = [

        [[2, 4], [5, 8]],

        [[6, 2, 9], [4, 1, 5]],

        [[3, 2, 7, 9], [4, 9, 6, 8]],

        [[1, 5, 2, 8, 6], [6, 1, 8, 4, 3]],

        [[5, 3, 9, 4, 1, 8], [7, 2, 4, 8, 5, 6]],

        [[8, 1, 2, 9, 3, 6, 5], [4, 7, 3, 9, 1, 2, 8]],

        [[9, 4, 3, 7, 6, 2, 5, 8], [7, 2, 8, 1, 9, 6, 5, 3]]

    ];



    var currentLengthIndex = 0;

    var currentTrialIndex = 0;

    var totalScore = 0;

    var errorsInCurrentLength = 0;

    var logs = [];

    var isPractice = true;

    var practiceSequences = [[3, 1], [2, 4]];

    var practiceTrialIndex = 0;



    var stimulusDiv = document.getElementById("ds-stimulus");

    var inputContainer = document.getElementById("ds-input-container");

    var inputField = document.getElementById("ds-input");

    var submitBtn = document.getElementById("ds-submit");

    var instructionsDiv = document.getElementById("ds-instructions");



    // -- תחילת מנגנון הגנה RTL --



    // נטרול הדבקה

    inputField.addEventListener('paste', function (e) {

        e.preventDefault();

    });



    // סניטציה ונעילת סמן

    inputField.addEventListener('input', function (e) {

        var sanitizedValue = this.value.replace(/\D/g, '');

        this.value = sanitizedValue;



        var len = this.value.length;

        setTimeout(function () {

            inputField.setSelectionRange(len, len);

        }, 0);

    });



    // -- סוף מנגנון הגנה RTL --



    // תמיכה בהזנה באמצעות Enter - מתוקן וחסין Qualtrics

    inputField.addEventListener("keydown", function (event) {

        // זיהוי המקש בשתי שיטות לתאימות דפדפנים מקסימלית

        if (event.key === "Enter" || event.keyCode === 13) {

            event.preventDefault(); // עצירת פעולת ברירת המחדל

            event.stopPropagation(); // חסימת חלחול האירוע למערכת Qualtrics

            submitBtn.click();

        }

    });



    function startTrial() {

        inputContainer.style.display = "none";

        inputField.value = "";

        instructionsDiv.innerHTML = isPractice ? "זה שלב תרגול - זכור את הספרות..." : "זכור את הספרות...";

        var seq = isPractice ? practiceSequences[practiceTrialIndex] : sequences[currentLengthIndex][currentTrialIndex];

        playSequence(seq, 0);

    }



    function playSequence(seq, index) {

        if (index < seq.length) {

            stimulusDiv.innerHTML = seq[index];

            setTimeout(function () {

                stimulusDiv.innerHTML = "";

                setTimeout(function () {

                    playSequence(seq, index + 1);

                }, 200); // מרווח ISI

            }, 800); // זמן חשיפה

        } else {

            stimulusDiv.innerHTML = "";

            instructionsDiv.innerHTML = isPractice ? "תרגול: הקלד בסדר הפוך (ולחץ Enter):" : "הקלד את הספרות בסדר הפוך (ולחץ Enter):";

            inputContainer.style.display = "block";

            inputField.focus(); // פוקוס אוטומטי להקלדה רציפה

        }

    }



    submitBtn.onclick = function () {

        var response = inputField.value.trim().replace(/\D/g, '');

        var seq = isPractice ? practiceSequences[practiceTrialIndex] : sequences[currentLengthIndex][currentTrialIndex];

        var expected = seq.slice().reverse().join("");



        var isCorrect = (response === expected);



        if (isPractice) {

            if (isCorrect) {

                practiceTrialIndex++;

                if (practiceTrialIndex >= practiceSequences.length) {

                    isPractice = false;

                    alert("סיימת את שלב התרגול! עכשיו תתחיל המטלה האמיתית.");

                    currentLengthIndex = 0;

                    currentTrialIndex = 0;

                    errorsInCurrentLength = 0;

                    inputContainer.style.display = "none";

                    inputField.value = "";

                    setTimeout(startTrial, 1000);

                } else {

                    inputContainer.style.display = "none";

                    inputField.value = "";

                    instructionsDiv.innerHTML = "תשובה נכונה! הכן עצמך לרצף הבא...";

                    setTimeout(startTrial, 1500);

                }

            } else {

                alert("טעות. עליך להקליד בסדר הפוך. הסדר הנכון היה: " + expected);

                practiceTrialIndex++;

                if (practiceTrialIndex >= practiceSequences.length) {

                    isPractice = false;

                    alert("סיימת את שלב התרגול! עכשיו תתחיל המטלה האמיתית.");

                    currentLengthIndex = 0;

                    currentTrialIndex = 0;

                    errorsInCurrentLength = 0;

                    inputContainer.style.display = "none";

                    inputField.value = "";

                    setTimeout(startTrial, 1000);

                } else {

                    inputContainer.style.display = "none";

                    inputField.value = "";

                    instructionsDiv.innerHTML = "נמשיך לגירוי התרגול הבא...";

                    setTimeout(startTrial, 1500);

                }

            }

            return;

        }

        if (isCorrect) {

            totalScore++;

        } else {

            errorsInCurrentLength++;

        }



        logs.push({

            length: seq.length,

            trial: currentTrialIndex + 1,

            presented: seq.join(""),

            expected: expected,

            response: response,

            correct: isCorrect ? 1 : 0

        });



        // בדיקת חוק עצירה (2 שגיאות באותו אורך)

        if (errorsInCurrentLength === 2) {

            endTask();

        } else {

            currentTrialIndex++;

            if (currentTrialIndex > 1) { // סיום 2 הניסיונות באורך הנוכחי

                currentTrialIndex = 0;

                currentLengthIndex++;

                errorsInCurrentLength = 0;

            }



            if (currentLengthIndex >= sequences.length) {

                endTask();

            } else {

                instructionsDiv.innerHTML = "הכן עצמך לרצף הבא...";

                inputContainer.style.display = "none";

                setTimeout(startTrial, 1000);

            }

        }

    };



    function endTask() {

        instructionsDiv.innerHTML = "מעבד נתונים...";

        inputContainer.style.display = "none";

        stimulusDiv.innerHTML = "";



        // כתיבה ישירה של הציון הסופי בלבד לכיור הנתונים

        if (qualtricsDataSink) {

            qualtricsDataSink.value = totalScore;



            // אילוץ אירועי קלט כדי ש-Qualtrics יקלוט את הנתון

            qualtricsDataSink.dispatchEvent(new Event('input', { bubbles: true }));

            qualtricsDataSink.dispatchEvent(new Event('change', { bubbles: true }));

        }



        // גיבוי ל-Embedded Data למקרה שהוגדר ב-Survey Flow

        Qualtrics.SurveyEngine.setEmbeddedData('DS_TotalScore', totalScore);



        // המשך אוטומטי לעמוד הבא

        setTimeout(function () {

            that.clickNextButton();

        }, 1000);

    }



    // השהיה בסיסית לפני תחילת המטלה לאחר טעינת הדף

    setTimeout(startTrial, 1500);

});