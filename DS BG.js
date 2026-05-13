Qualtrics.SurveyEngine.addOnload(function() {
    var that = this;
    that.hideNextButton(); // מניעת התקדמות מוקדמת לפני סיום המטלה

    // איתור והסתרת תיבת הטקסט המקורית של Qualtrics (כיור הנתונים)
    var qContainer = that.getQuestionContainer();
    var qualtricsDataSink = qContainer.querySelector('textarea') || qContainer.querySelector('input[type="text"]');
    if(qualtricsDataSink) {
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

    // מנגנון אימון (Practice Trial)
    var isPractice = true;
    var practiceSeq = [1, 3];
    var practiceExpected = "31";

    var currentLengthIndex = 0;
    var currentTrialIndex = 0;
    var totalScore = 0;
    var errorsInCurrentLength = 0;
    var logs = [];

    var stimulusDiv = document.getElementById("ds-stimulus");
    var inputContainer = document.getElementById("ds-input-container");
    var inputField = document.getElementById("ds-input");
    var submitBtn = document.getElementById("ds-submit");
    var instructionsDiv = document.getElementById("ds-instructions");

    // נטרול הדבקה
    inputField.addEventListener('paste', function(e) {
        e.preventDefault();
    });

    // סניטציה בלבד - ללא כפיית קפיצת סמן (תיקון 4)
    inputField.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });

    // תמיכה בהזנה באמצעות Enter
    inputField.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault(); 
            event.stopPropagation(); 
            submitBtn.click();
        }
    });

    function startTrial() {
        inputContainer.style.display = "none";
        inputField.value = "";
        
        if (isPractice) {
            instructionsDiv.innerHTML = "שלב אימון: זכור את הספרות...";
            playSequence(practiceSeq, 0);
        } else {
            instructionsDiv.innerHTML = "זכור את הספרות...";
            var seq = sequences[currentLengthIndex][currentTrialIndex];
            playSequence(seq, 0);
        }
    }

    // תזמונים מעודכנים לפי תקן WAIS-IV (תיקון 2)
    function playSequence(seq, index) {
        if (index < seq.length) {
            stimulusDiv.innerHTML = seq[index];
            setTimeout(function() {
                stimulusDiv.innerHTML = "";
                setTimeout(function() {
                    playSequence(seq, index + 1);
                }, 200); // ISI מעודכן
            }, 800); // זמן חשיפה מעודכן
        } else {
            stimulusDiv.innerHTML = "";
            instructionsDiv.innerHTML = "הקלד את הספרות בסדר הפוך (ולחץ Enter):";
            inputContainer.style.display = "block";
            inputField.focus(); 
        }
    }

    submitBtn.onclick = function() {
        var response = inputField.value.trim().replace(/\D/g, ''); 
        
        // טיפול בשלב אימון (תיקון 3)
        if (isPractice) {
            if (response === practiceExpected) {
                alert("מצוין! הבנת את המטלה. כעת נתחיל במבחן האמיתי.");
                isPractice = false;
                inputContainer.style.display = "none";
                setTimeout(startTrial, 1000);
            } else {
                alert("טעות. הרצף שהוצג היה 1 ואז 3. בסדר הפוך עליך להקליד 31. נסה שוב.");
                inputContainer.style.display = "none";
                setTimeout(startTrial, 1000);
            }
            return;
        }

        // טיפול בשלב המדידה
        var seq = sequences[currentLengthIndex][currentTrialIndex];
        var expected = seq.slice().reverse().join("");
        var isCorrect = (response === expected);
        
        if (isCorrect) {
            totalScore++;
            errorsInCurrentLength = 0;
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

        if (errorsInCurrentLength === 2) {
            endTask();
        } else {
            currentTrialIndex++;
            if (currentTrialIndex > 1) { 
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
        if(qualtricsDataSink) {
            qualtricsDataSink.value = totalScore;
            qualtricsDataSink.dispatchEvent(new Event('input', { bubbles: true }));
            qualtricsDataSink.dispatchEvent(new Event('change', { bubbles: true }));
        }

        Qualtrics.SurveyEngine.setEmbeddedData('DS_TotalScore', totalScore);
        
        // תיקון 1 הושמט: אין שמירה של מערך ה-logs ל-Embedded Data
        
        setTimeout(function() {
            that.clickNextButton(); 
        }, 1000);
    }

    // השהיה בסיסית לפני תחילת המטלה לאחר טעינת הדף
    setTimeout(startTrial, 1500);
});