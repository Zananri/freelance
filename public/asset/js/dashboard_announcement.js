$(document).ready(function() {
    const attendanceData = {
        annual_leave: 5,
        sick: 3,
        present: 20,
        absent: 2
    };

    const ctx = document.getElementById('attendanceChart');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Annual Leave', 'Sick', 'Present', 'Absent'],
            datasets: [{
                data: [
                    attendanceData.annual_leave,
                    attendanceData.sick,
                    attendanceData.present,
                    attendanceData.absent
                ],
                backgroundColor: [
                    '#FFAE4C',
                    '#8979FF',
                    '#3CC3DF',
                    '#FF928A',
                ],
                borderwidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: false, 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label} : ${context.raw} Days`;
                        }
                    }
                }
            }
        }
    })
})