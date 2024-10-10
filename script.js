let data = {};  // Object to hold merged data

async function fetchAndDecryptJson(url, password) {
    try {
        const response = await fetch(url);
        const encryptedData = await response.text();

        const passwordBytes = CryptoJS.enc.Utf8.parse(password);
        const key = CryptoJS.SHA256(passwordBytes);

        const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedData);

        const iv = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(0, 4));
        const ciphertext = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(4));

        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext }, 
            key, 
            { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );

        const decryptedJson = decrypted.toString(CryptoJS.enc.Utf8);

        return JSON.parse(decryptedJson);
    } catch (error) {
        throw new Error('Error decrypting JSON data: ' + error);
    }
}

async function loadData() {
    const tick = document.getElementById('search-box').value.trim(); // Get tick from the search box
    if (!tick) {
        displayMessage('Please enter a tick.');
        return;
    }

    const randomstr = "YnVkZGhhX2Jhcl9jaGFuZHJh"; // Your encoded password
    const randstr = atob(randomstr);

    try {
        const response = await fetch('tick_file_map.json');
        const tickFileMap = await response.json();
        const fileName = tickFileMap[tick];

        if (!fileName) {
            displayMessage(`No data available for the tick: ${tick}`);
            return;
        }

        const jsonData = await fetchAndDecryptJson(fileName, randstr);
        Object.assign(data, jsonData);
        displayMessage(`Data loaded for tick: ${tick}`);
        plotGraph();  // Call plotGraph after data is loaded

    } catch (error) {
        displayMessage('Error loading or decrypting JSON data: ' + error);
    }
}

// Event listener for the search button click
document.getElementById('search-button').addEventListener('click', loadData);

// Function to display messages
function displayMessage(message) {
    document.getElementById('message').textContent = message;
}

function plotGraph() {
    const tick = document.getElementById("search-box").value.trim();
    
    if (!tick) {
        displayMessage("Please enter a tick.");
        return;
    }

    if (tick in data) {
        const tickData = data[tick];
        displayMessage(`Data found for tick: ${tick}`);

        // Extract candlestick data
        const dates = tickData.map(entry => entry.Datetime.slice(0, 10)); // Use YYYY-MM-DD
        // Get the last date from the dates array
        let lastDate1 = new Date(dates[dates.length - 1]);
        
        // Function to format date as 'YYYY-MM-DD'
        function formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        // Add 10 additional days to the dates array
        for (let i = 1; i <= 10; i++) {
            lastDate1.setDate(lastDate1.getDate() + 1);
            dates.push(formatDate(lastDate1));
        }
        
        const opens = tickData.map(entry => entry.open);
        const highs = tickData.map(entry => entry.high);
        const lows = tickData.map(entry => entry.low);
        const closes = tickData.map(entry => entry.close);
        const volumes = tickData.map(entry => entry.volume);
        const d_values = tickData.map(entry => entry.k);
        const k_values = tickData.map(entry => entry.d);
        const bbl_values = tickData.map(entry => entry.BBL);
        const bbm_values = tickData.map(entry => entry.BBM);
        const bbu_values = tickData.map(entry => entry.BBU);

        // Get first and last date for setting X-axis range
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];

        // Extend the chart to include 10 additional days
        const extendedLastDate = new Date(lastDate);
        extendedLastDate.setDate(extendedLastDate.getDate() + 10);
        
        // Convert the extended date back to a YYYY-MM-DD format for the chart
        const formattedExtendedLastDate = extendedLastDate.toISOString().slice(0, 10);
        
        // Determine the appropriate JSON file to load based on tick suffix
        const missingDatesFile = tick.endsWith('.Daily') ? 'missing_dates.json' : 'missing_dates_w.json';
    
        // Load the selected missing dates file and plot the chart
        fetch(missingDatesFile)
            .then(response => response.json())
            .then(missingDates => {
                // Candlestick data
                var candlestick = {
                    x: dates,
                    open: opens,
                    high: highs,
                    low: lows,
                    close: closes,
                    type: 'candlestick',
                    name: 'Price',
                    xaxis: 'x',
                    yaxis: 'y1',
                    // increasing: {line: {color: '#17BECF'}},
                    // decreasing: {line: {color: '#7F7F7F'}}
                };
                
                // Volume bar chart trace
                var volume_trace = {
                    x: dates,
                    y: volumes,
                    type: 'bar',
                    name: 'Volume',
                    marker: { color: 'rgba(100, 150, 250, 0.4)' },
                    xaxis: 'x',
                    yaxis: 'y2'
                };
                
                // K and D oscillator traces
                var k_trace = {
                    x: dates,
                    y: k_values,
                    mode: 'lines',
                    name: 'K',
                    line: { color: 'blue', width: 0.5 },
                    xaxis: 'x',
                    yaxis: 'y3'
                };
                
                var d_trace = {
                    x: dates,
                    y: d_values,
                    mode: 'lines',
                    name: 'D',
                    line: { color: 'orange', width: 0.5 },
                    xaxis: 'x',
                    yaxis: 'y3'
                };
                
                
                // Overbought and Oversold lines (for the K and D Oscillator)
                var ob_line = {
                    x: dates,
                    y: Array(dates.length).fill(80),
                    mode: 'lines',
                    name: 'Overbought (80)',
                    line: { color: 'red', dash: 'dash', width: 0.5 },
                    xaxis: 'x',
                    yaxis: 'y3'
                };
                
                var os_line = {
                    x: dates,
                    y: Array(dates.length).fill(20),
                    mode: 'lines',
                    name: 'Oversold (20)',
                    line: { color: 'green', dash: 'dash', width: 0.5 },
                    xaxis: 'x',
                    yaxis: 'y3'
                };
                
                                // Bollinger Bands traces
                var bbl_trace = {
                    x: dates,
                    y: bbl_values,
                    mode: 'lines',
                    name: 'Bollinger Lower Band',
                    line: { color: 'red', width: 0.5},
                    xaxis: 'x',
                    yaxis: 'y1',
                    hoverinfo:'none'
                };

                var bbm_trace = {
                    x: dates,
                    y: bbm_values,
                    mode: 'lines',
                    name: 'Bollinger Upper Band',
                    line: { color: 'blue', width: 0.5},
                    xaxis: 'x',
                    yaxis: 'y1',
                    hoverinfo:'none'
                };

                var bbu_trace = {
                    x: dates,
                    y: bbu_values,
                    mode: 'lines',
                    name: 'Bollinger Upper Band',
                    line: { color: 'green',width: 0.5},
                    xaxis: 'x',
                    yaxis: 'y1',
                    hoverinfo:'none'
                };

                // Extract the required data from tickData
        var fibData = tickData.map(entry => ({
            date: entry.Datetime.slice(0, 10),  // The date
            low: entry.low,        // Low of the candle
            high: entry.high,      // High of the candle
            dataTuple: entry.Data_tuple // Data_tuple
        }));

        // Initialize the rectangles array
        var rectangles = [];

        // Loop through fibData to create rectangles based on Data_tuple
        fibData.forEach((item) => {
            var dataTuple = item.dataTuple;

            // Only process if Data_tuple is not 0
            if (dataTuple !== 0) {
                var secondValue = dataTuple[2].slice(0, 10);  // Date (second value in Data_tuple)
                var fifthValue = dataTuple[5];   // true or false (fifth value)
                var sixthValue = dataTuple[6];   // Fibonacci retracement (sixth value)
                
                // Determine y0 (starting point) based on fifthValue (low or high)
                var y0 = fifthValue ? item.low : item.high;

                // Find index of secondValue in the dates array
                var index = dates.indexOf(secondValue);

                    // Calculate 10 bars ahead, limiting to the array length
                const aheadIndex = Math.min(index + 20, dates.length -1);

                var x1Date = dates[aheadIndex];  // The date 10 bars ahead
                // Add rectangle based on Data_tuple values
                rectangles.push({
                    type: 'rect',
                    xref: 'x',
                    yref: 'y1',
                    x0: secondValue,  // The time of the candle
                    x1: x1Date,  // End time (same as start for a vertical rectangle)
                    y0: sixthValue["23.6% retracement"],           // Draw from low or high
                    y1: y0,  // Draw to the 50% retracement level
                    line: {
                        color: 'rgba(255, 255, 0, 0.3)',
                        width: 0.5
                    },
                    fillcolor: 'rgba(255, 255, 0, 0.3)'
                },
                    
                    {
                    type: 'rect',
                    xref: 'x',
                    yref: 'y1',
                    x0: secondValue,  // The time of the candle
                    x1: x1Date,  // End time (same as start for a vertical rectangle)
                    y0: sixthValue["38.2% retracement"],           // Draw from low or high
                    y1: sixthValue["23.6% retracement"],  // Draw to the 50% retracement level
                    line: {
                        color: 'rgba(0, 255, 0, 0.3)',
                        width: 0.5
                    },
                    fillcolor: 'rgba(0, 255, 0, 0.3)'
                },
                
                {type: 'rect',
                    xref: 'x',
                    yref: 'y1',
                    x0: secondValue,  // The time of the candle
                    x1: x1Date,  // End time (same as start for a vertical rectangle)
                    y0: sixthValue["50.0% retracement"],           // Draw from low or high
                    y1: sixthValue["38.2% retracement"],  // Draw to the 50% retracement level
                    line: {
                        color: 'rgba(0, 0, 255, 0.3)',
                        width: 0.5
                    },
                    fillcolor: 'rgba(0, 0, 255, 0.3)'
                },
                
               {type: 'rect',
                    xref: 'x',
                    yref: 'y1',
                    x0: secondValue,  // The time of the candle
                    x1: x1Date,  // End time (same as start for a vertical rectangle)
                    y0: sixthValue["61.8% retracement"],           // Draw from low or high
                    y1: sixthValue["50.0% retracement"],  // Draw to the 50% retracement level
                    line: {
                        color: 'rgba(0, 100, 0, 0.3)',
                        width: 0.5
                    },
                    fillcolor: 'rgba(0, 100, 0, 0.3)'
                },
                );
            }
        });

                // Layout for the chart
var layout = {
    title: `Study for ${tick}`,
    height: 800,
    grid: {
        rows: 3,
        columns: 1,
        pattern: 'independent',
        roworder: 'top to bottom'
    },
    xaxis: {
        autorange: true,
        rangeslider: { 
            visible: true, 
            range: [firstDate, formattedExtendedLastDate],
            thickness: 0.05, // Make the range slider thinner
            yaxis: {
                rangemode: 'match' // Ensure the y-axis is consistent
            }
        },
        rangebreaks: missingDates.map(date => ({ values: [date] })),
        title: 'Date'
    },
    yaxis1: {
        title: 'Price',
        domain: [0.4, 1],  // Height for candlestick panel
        autorange: true,
        anchor: 'x'
    },
    yaxis2: {
        title: 'Volume',
        domain: [0.25, 0.39],  // Height for volume panel
        autorange: true,
        anchor: 'x'
    },
    yaxis3: {
        title: 'Oscillator',
        domain: [0, 0.24],  // Height for oscillator panel
        autorange: true,
        anchor: 'x'
    },
    showlegend: true,
    hovermode: 'x',
    shapes: rectangles, // Add rectangles to the layout
    margin: {
        t: 50,  // Top margin for title
        r: 20,  // Right margin
        b: 40,  // Bottom margin for x-axis labels
        l: 40   // Left margin
    },
    responsive: true, // Enable responsive behavior
    autosize: true // Allow automatic sizing based on viewport
};

// Adjust height dynamically for mobile screens
if (window.innerWidth <= 768) {
    layout.height = 400; // Reduce height for smaller screens
    layout.title.font = { size: 16 }; // Adjust title font size for mobile
    layout.xaxis.title.font = { size: 14 }; // Adjust x-axis title font size for mobile
    layout.yaxis1.title.font = { size: 14 }; // Adjust y-axis 1 title font size for mobile
    layout.yaxis2.title.font = { size: 14 }; // Adjust y-axis 2 title font size for mobile
    layout.yaxis3.title.font = { size: 14 }; // Adjust y-axis 3 title font size for mobile
}


                // Plot the chart
                Plotly.newPlot('plot', [candlestick, volume_trace, k_trace, d_trace, ob_line, os_line, bbl_trace, bbm_trace, bbu_trace], layout, {showSendToCloud: true});

                // Set up relayout event for auto-scaling on zoom, pan, or rangeslider move
                var myPlot = document.getElementById('plot');
                var isUnderRelayout = false;
                
                myPlot.on('plotly_relayout', function (relayoutData) {
                    if (isUnderRelayout !== true) {
                        isUnderRelayout = true;

                        // Get the start and end dates from the current view or rangeslider
                        var start = relayoutData['xaxis.range'] ? relayoutData['xaxis.range'][0].slice(0, 10) : firstDate;
                        var end = relayoutData['xaxis.range'] ? relayoutData['xaxis.range'][1].slice(0, 10) : lastDate;

                        // Get the index range
                        var xstart = myPlot.data[0].x.indexOf(start);
                        var xend = myPlot.data[0].x.indexOf(end);
                        
                        if (xstart < 0) { xstart = 0; }
                        if (xend < 0) { xend = myPlot.data[0].x.length - 1; }

                        // Find the min and max values in the visible range
                        var low = Math.min.apply(null, myPlot.data[0].low.slice(xstart, xend));
                        var high = Math.max.apply(null, myPlot.data[0].high.slice(xstart, xend));

                        // Update the Y-axis range
                        var update = {'yaxis.range': [low, high]};
                        Plotly.relayout(myPlot, update).then(() => { isUnderRelayout = false; });
                    }
                });

                myPlot.on('plotly_click', function (data) {
                var pointIndex = data.points[0].pointIndex;
                
                // Make sure tickData is defined and accessible here
                if (tickData && tickData.length > pointIndex) {
                    var dataTuple = tickData[pointIndex].Data_tuple;
                    var gap = tickData[pointIndex].GAP;
                    var retracements = tickData[pointIndex].Data_tuple[6];
                    var slh = tickData[pointIndex].high
                    var sll = tickData[pointIndex].low
                    var mar = dataTuple[7]
                    var atrv = dataTuple[8]
                    // console.log(dataTuple)
                    // console.log(mar)
                    // console.log(mar[1])
                    // // Show the info boxes
                    document.getElementById("info-boxes").style.display = "flex";

                    // Fill box1 based on Data_tuple[0]
    if (dataTuple[0] === 'ABC') {
        document.getElementById("box1").innerText = "T1";
    } else if (dataTuple[0] === 'ABCD') {
        document.getElementById("box1").innerText = "T2";
    } else if (dataTuple[0] === 'XABCD') {
        document.getElementById("box1").innerText = "T3";
    } else {
        document.getElementById("box1").innerText = ""; // Clear if none match
    }

    // Set the text color for box1 based on dataTuple[5]
    const textColor = (dataTuple[5] === true) ? "#008000" : "#FF0000"; // Green if true, red if false
    document.getElementById("box1").style.color = textColor;

    // Set background color for boxes if needed (optional)
    const boxColor = (dataTuple[5] === true) ? "#90EE90" : "#FFCCCB"; // LightGreen or LightCoral
    document.getElementById("box1").style.backgroundColor = boxColor;

    document.getElementById("box2").innerText = gap;

    const textColorGap = (gap > 0) ? "#008000" : (gap < 0) ? "#FF0000" : "";
    const boxColorGap = (gap>0) ? "#90EE90" : (gap < 0) ? "#FFCCCB": ""; 
    

    document.getElementById("box2").style.color = textColorGap;
    document.getElementById("box2").style.backgroundColor = boxColorGap;

    let maru = '';
    let textColorMar = '';
    let   boxColorMar = '';
    // Text for box 3
    if (mar !== 'None') {
    if (mar[1] > 0 && dataTuple[5] === true) {
        maru = 'BullMB';
        const textColorMar = "#008000";
        const   boxColorMar = "#90EE90";
    } else if (mar[1] > 0 && dataTuple[5] === false) {
        maru = 'BullMB';
        const textColorMar = "#008000";
        const   boxColorMar = "#90EE90";
    } else if (mar[1] < 0 && dataTuple[5] === false) {
        maru = 'BearMB';
        const textColorMar = "#FF0000";
        const   boxColorMar = "#FFCCCB";
    } else if (mar[1] < 0 && dataTuple[5] === true) {
        maru = 'BearMB';
        const textColorMar = "#FF0000";
        const   boxColorMar = "#FFCCCB";
    }
} else {
    // Fallback when mar is 'None'
    maru = '';
    const textColorMar = dataTuple[5] === false ? "#FF0000" : "#008000";
    const   boxColorMar = dataTuple[5] === false ? "#FFCCCB" : "#90EE90";
}

    document.getElementById("box3").style.color = textColorMar;
    document.getElementById("box3").style.backgroundColor = boxColorMar;

    document.getElementById("box3").innerText = maru;

                    
    if (dataTuple !== 0 && dataTuple[5] === true) {
        sl = sll;
    } else if (dataTuple !== 0 && dataTuple[5] === false) {
        sl = slh;
    }
    else {
        sl = "";
    }
    
    
    document.getElementById("box5").style.color = "#FF0000";
    document.getElementById("box5").style.backgroundColor = "#FF00004D";

    document.getElementById("box5").innerText = sl;

    const f23bc = "#FFFF004D";
    const f38bc = "#00FF004D";
    const f50bc = "#0000FF4D";
    const f61bc = "#0064004D";

    // const f23tc = "#FFFF00";
    const f38tc = "#008000";
    const f50tc = "#0000FF";
    const f61tc = "#006400";

    document.getElementById("box6").innerText = retracements["23.6% retracement"];

    document.getElementById("box7").innerText = retracements["38.2% retracement"];

    document.getElementById("box8").innerText = retracements["50.0% retracement"];

    document.getElementById("box9").innerText = retracements["61.8% retracement"];
   
    document.getElementById("box6").style.backgroundColor = f23bc;
    document.getElementById("box7").style.backgroundColor = f38bc;
    document.getElementById("box8").style.backgroundColor = f50bc;
    document.getElementById("box9").style.backgroundColor = f61bc;
    
    // document.getElementById("box6").style.color = f23tc;
    document.getElementById("box7").style.color = f38tc;
    document.getElementById("box8").style.color = f50tc;
    document.getElementById("box9").style.color = f61tc;

    // Data for box9
    const atrtextColor = (atrv === false) ? "#008000" : "#FF0000"; // Green if true, red if false
    document.getElementById("box4").style.color = textColor;

    // Set background color for boxes if needed (optional)
    const atrboxColor = (atrv === false) ? "#90EE90" : "#FFCCCB"; // LightGreen or LightCoral
    document.getElementById("box4").style.backgroundColor = boxColor;

    const bt9 = (atrv === false) ? "Normal" : "High";
    document.getElementById("box4").innerText = bt9;

        }
    });
        

            })
            .catch(error => displayMessage('Error fetching missing dates: ' + error));

    } else {
        displayMessage(`No data found for tick: ${tick}`);
    }
}


// Your existing functions and logic

// New function to load symbols from symbols.json
function loadSymbols() {
    fetch('keys_list.json')
        .then(response => response.json())
        .then(data => {
            symbols = data; // Assume symbols.json is an array of tick names
            displayMessage("Symbols loaded successfully.");
        })
        .catch(error => displayMessage('Error loading symbols: ' + error));
}

// Call loadSymbols when the page loads
window.onload = function() {
    loadData(); // Existing function
    loadSymbols(); // Call to load symbols
};

// New function to filter symbols based on input
function filterSymbols(input) {
    return symbols.filter(symbol => symbol.toLowerCase().includes(input.toLowerCase()));
}

// New function to display filtered suggestions
function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById("suggestions");
    suggestionsDiv.innerHTML = ""; // Clear previous suggestions

    if (suggestions.length === 0) {
        return; // No suggestions to display
    }

    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement("div");
        suggestionItem.textContent = suggestion;
        suggestionItem.onclick = () => {
            document.getElementById("search-box").value = suggestion; // Set the input value
            suggestionsDiv.innerHTML = ""; // Clear suggestions
        };
        suggestionsDiv.appendChild(suggestionItem);
    });
}

// New event listener for the search box to filter suggestions
document.getElementById("search-box").addEventListener("input", function() {
    const input = this.value.trim();
    if (input) {
        const filteredSuggestions = filterSymbols(input);
        displaySuggestions(filteredSuggestions);
    } else {
        document.getElementById("suggestions").innerHTML = ""; // Clear suggestions if input is empty
    }
});
