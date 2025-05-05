// Replace the calculateBtn event listener with this full implementation
calculateBtn.addEventListener('click', function() {
    // Get all input values
    const homePriceVal = parseFloat(homePrice.value) || 0;
    const downPaymentVal = parseFloat(downPayment.value) || 0;
    const loanTermVal = parseInt(loanTerm.value) || 30;
    const interestRateVal = parseFloat(interestRate.value) || 3.5;
    const startDateVal = document.getElementById('startDate').valueAsDate || new Date();
    
    // Advanced options
    const propertyTaxVal = parseFloat(document.getElementById('propertyTax').value) || 0;
    const homeInsuranceVal = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const pmiVal = parseFloat(document.getElementById('pmi').value) || 0;
    const hoaVal = parseFloat(document.getElementById('hoa').value) || 0;
    const extraPaymentVal = parseFloat(document.getElementById('extraPayment').value) || 0;

    // Calculate loan amount
    const loanAmount = homePriceVal - downPaymentVal;
    
    // Monthly interest rate
    const monthlyRate = interestRateVal / 100 / 12;
    
    // Number of payments
    const numberOfPayments = loanTermVal * 12;
    
    // Calculate monthly payment (principal + interest)
    const monthlyPIPayment = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    // Calculate total monthly payment with all components
    const monthlyTax = propertyTaxVal / 12;
    const monthlyInsurance = homeInsuranceVal / 12;
    const monthlyPMI = (pmiVal > 0 && downPaymentVal/homePriceVal < 0.2) ? 
        (loanAmount * (pmiVal/100)) / 12 : 0;
    
    const totalMonthlyPayment = monthlyPIPayment + monthlyTax + 
                              monthlyInsurance + monthlyPMI + hoaVal + extraPaymentVal;
    
    // Calculate total interest
    const totalInterest = (monthlyPIPayment * numberOfPayments) - loanAmount;
    
    // Calculate total cost
    const totalCost = loanAmount + totalInterest + (propertyTaxVal * loanTermVal) + 
                     (homeInsuranceVal * loanTermVal) + (monthlyPMI * numberOfPayments) + 
                     (hoaVal * numberOfPayments);
    
    // Calculate payoff date
    const payoffDate = new Date(startDateVal);
    payoffDate.setMonth(payoffDate.getMonth() + numberOfPayments);
    
    // Update summary cards
    document.querySelector('.monthly-payment .value').textContent = `$${totalMonthlyPayment.toFixed(2)}`;
    document.querySelectorAll('.summary-card .value')[1].textContent = `$${totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    document.querySelectorAll('.summary-card .value')[2].textContent = payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Update payment breakdown chart
    paymentChart.data.datasets[0].data = [
        monthlyPIPayment,
        (monthlyPIPayment * numberOfPayments - loanAmount) / numberOfPayments,
        monthlyTax,
        monthlyInsurance,
        monthlyPMI,
        hoaVal
    ];
    paymentChart.update();
    
    // Update summary tab
    const summaryTab = document.getElementById('summaryTab');
    summaryTab.innerHTML = `
        <h4>Loan Summary</h4>
        <table>
            <tr>
                <td>Loan Amount</td>
                <td>$${loanAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
            </tr>
            <tr>
                <td>Total Interest Paid</td>
                <td>$${totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
            </tr>
            <tr>
                <td>Total Cost of Loan</td>
                <td>$${totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
            </tr>
            <tr>
                <td>Payoff Date</td>
                <td>${payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
            </tr>
            <tr>
                <td>Interest Savings (vs 30-year)</td>
                <td>${loanTermVal === 30 ? '$0' : 'Calculate with 30-year option to compare'}</td>
            </tr>
        </table>
        
        <h4 style="margin-top: 20px;">Payment Breakdown</h4>
        <table>
            <tr>
                <td>Principal & Interest</td>
                <td>$${monthlyPIPayment.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Property Tax</td>
                <td>$${monthlyTax.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Home Insurance</td>
                <td>$${monthlyInsurance.toFixed(2)}</td>
            </tr>
            <tr>
                <td>PMI</td>
                <td>$${monthlyPMI.toFixed(2)}</td>
            </tr>
            <tr>
                <td>HOA Fees</td>
                <td>$${hoaVal.toFixed(2)}</td>
            </tr>
            <tr>
                <td><strong>Total Monthly Payment</strong></td>
                <td><strong>$${totalMonthlyPayment.toFixed(2)}</strong></td>
            </tr>
        </table>
    `;
    
    // Generate amortization schedule
    generateAmortizationSchedule(loanAmount, monthlyRate, numberOfPayments, monthlyPIPayment, startDateVal);
    
    // Update comparison tab
    updateComparisonTab(homePriceVal, downPaymentVal, loanTermVal, interestRateVal);
});

// Helper function to generate amortization schedule
function generateAmortizationSchedule(loanAmount, monthlyRate, numberOfPayments, monthlyPayment, startDate) {
    const tableBody = document.getElementById('amortizationTableBody');
    tableBody.innerHTML = '';
    
    let balance = loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;
    const date = new Date(startDate);
    
    // We'll show 5 years of amortization or full term if less than 5 years
    const displayYears = Math.min(5, Math.ceil(numberOfPayments / 12));
    
    for (let year = 1; year <= displayYears; year++) {
        let yearInterest = 0;
        let yearPrincipal = 0;
        
        for (let month = 1; month <= 12; month++) {
            if (balance <= 0) break;
            
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            yearInterest += interestPayment;
            yearPrincipal += principalPayment;
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
            
            balance -= principalPayment;
            date.setMonth(date.getMonth() + 1);
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Year ${year} (${date.getFullYear()})</td>
            <td>$${yearPrincipal.toFixed(2)}</td>
            <td>$${yearInterest.toFixed(2)}</td>
            <td>$${(yearInterest + yearPrincipal).toFixed(2)}</td>
            <td>$${balance > 0 ? balance.toFixed(2) : '0.00'}</td>
        `;
        tableBody.appendChild(row);
        
        if (balance <= 0) break;
    }
}

// Helper function to update comparison tab
function updateComparisonTab(homePrice, downPayment, currentTerm, currentRate) {
    const compareTab = document.getElementById('compareTab');
    const loanAmount = homePrice - downPayment;
    
    // Calculate different scenarios
    const scenarios = [
        { term: 15, rate: currentTerm === 15 ? currentRate : currentRate - 0.75 },
        { term: 20, rate: currentTerm === 20 ? currentRate : currentRate - 0.5 },
        { term: 30, rate: currentTerm === 30 ? currentRate : currentRate }
    ];
    
    let comparisonHTML = '<h4>Compare Loan Options</h4><table><thead><tr><th>Term</th><th>Rate</th><th>Monthly Payment</th><th>Total Interest</th><th>Savings</th></tr></thead><tbody>';
    
    scenarios.forEach(scenario => {
        const monthlyRate = scenario.rate / 100 / 12;
        const numPayments = scenario.term * 12;
        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
            (Math.pow(1 + monthlyRate, numPayments) - 1);
        const totalInterest = (monthlyPayment * numPayments) - loanAmount;
        
        // Calculate savings compared to 30-year (if not 30-year)
        let savings = '';
        if (scenario.term !== 30) {
            const thirtyYearRate = scenarios.find(s => s.term === 30).rate;
            const thirtyYearMonthlyRate = thirtyYearRate / 100 / 12;
            const thirtyYearPayment = loanAmount * 
                (thirtyYearMonthlyRate * Math.pow(1 + thirtyYearMonthlyRate, 360)) / 
                (Math.pow(1 + thirtyYearMonthlyRate, 360) - 1);
            const thirtyYearInterest = (thirtyYearPayment * 360) - loanAmount;
            savings = `$${(thirtyYearInterest - totalInterest).toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }
        
        comparisonHTML += `
            <tr>
                <td>${scenario.term}-year</td>
                <td>${scenario.rate.toFixed(2)}%</td>
                <td>$${monthlyPayment.toFixed(2)}</td>
                <td>$${totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                <td>${savings || '-'}</td>
            </tr>
        `;
    });
    
    comparisonHTML += '</tbody></table>';
    compareTab.innerHTML = comparisonHTML;
}