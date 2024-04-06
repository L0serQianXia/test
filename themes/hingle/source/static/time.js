function time(){
	var start = Date.parse(new Date("2024/2/15 16:00:00"));
	var now = Date.parse(new Date());
	var difference = now - start;
	var day = parseInt(difference / (1000 * 60 * 60 * 24));
	var hour = parseInt((difference - (day * 1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	var minute = parseInt((difference - (day * 1000 * 60 * 60 * 24) - (hour * 1000 * 60 * 60)) / (1000 * 60))
	var second = parseInt((difference - (day * 1000 * 60 * 60 * 24) - (hour * 1000 * 60 * 60) - (minute * 1000 * 60)) / 1000)
	var a = document.getElementById("website_running_time");
	a.innerHTML = "网站已运行" + day + "天" + hour + "小时" + minute + "分钟" + second + "秒！"
	setTimeout(time, 1000);
}
time()