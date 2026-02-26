interface Station {
  name: string;
  abbr: string;
}

type BartEstimate = {
  minutes: string;
  platform: string;
};

type BartEtd = {
  destination: string;
  estimate: BartEstimate | BartEstimate[];
};

type BartStation = {
  etd?: BartEtd[];
};

type BartResponse = {
  root?: {
    station?: BartStation[];
  };
};

let currentStation = "EMBR";
let logSeq = 0;
let warnedNoProxy = false;
const refreshSeconds = 15;
let remainingSeconds = refreshSeconds;
let refreshTimer: number | undefined;

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const configuredProxyBase =
  (window as unknown as { BART_PROXY_BASE?: string }).BART_PROXY_BASE;
const apiBase: string | null = configuredProxyBase ?? (isLocalhost ? "" : null);

const stations: Station[] = [
  { name: "12th St. Oakland City Center", abbr: "12TH" },
  { name: "16th St. Mission", abbr: "16TH" },
  { name: "19th St. Oakland", abbr: "19TH" },
  { name: "24th St. Mission", abbr: "24TH" },
  { name: "Antioch", abbr: "ANTC" },
  { name: "Ashby", abbr: "ASHB" },
  { name: "Balboa Park", abbr: "BALB" },
  { name: "Bay Fair", abbr: "BAYF" },
  { name: "Berryessa/North San Jose", abbr: "BERY" },
  { name: "Castro Valley", abbr: "CAST" },
  { name: "Civic Center/UN Plaza", abbr: "CIVC" },
  { name: "Coliseum", abbr: "COLS" },
  { name: "Colma", abbr: "COLM" },
  { name: "Concord", abbr: "CONC" },
  { name: "Daly City", abbr: "DALY" },
  { name: "Downtown Berkeley", abbr: "DBRK" },
  { name: "Dublin/Pleasanton", abbr: "DUBL" },
  { name: "El Cerrito del Norte", abbr: "DELN" },
  { name: "El Cerrito Plaza", abbr: "PLZA" },
  { name: "Embarcadero", abbr: "EMBR" },
  { name: "Fremont", abbr: "FRMT" },
  { name: "Fruitvale", abbr: "FTVL" },
  { name: "Glen Park", abbr: "GLEN" },
  { name: "Hayward", abbr: "HAYW" },
  { name: "Lafayette", abbr: "LAFY" },
  { name: "Lake Merritt", abbr: "LAKE" },
  { name: "MacArthur", abbr: "MCAR" },
  { name: "Millbrae", abbr: "MLBR" },
  { name: "Milpitas", abbr: "MLPT" },
  { name: "Montgomery St.", abbr: "MONT" },
  { name: "North Berkeley", abbr: "NBRK" },
  { name: "North Concord/Martinez", abbr: "NCON" },
  { name: "Oakland International Airport", abbr: "OAKL" },
  { name: "Orinda", abbr: "ORIN" },
  { name: "Pittsburg/Bay Point", abbr: "PITT" },
  { name: "Pittsburg Center", abbr: "PCTR" },
  { name: "Pleasant Hill/Contra Costa Centre", abbr: "PHIL" },
  { name: "Powell St.", abbr: "POWL" },
  { name: "Richmond", abbr: "RICH" },
  { name: "Rockridge", abbr: "ROCK" },
  { name: "San Bruno", abbr: "SBRN" },
  { name: "San Francisco International Airport", abbr: "SFIA" },
  { name: "San Leandro", abbr: "SANL" },
  { name: "South Hayward", abbr: "SHAY" },
  { name: "South San Francisco", abbr: "SSAN" },
  { name: "Union City", abbr: "UCTY" },
  { name: "Walnut Creek", abbr: "WCRK" },
  { name: "Warm Springs/South Fremont", abbr: "WARM" },
  { name: "West Dublin/Pleasanton", abbr: "WDUB" },
  { name: "West Oakland", abbr: "WOAK" }
];

function populateDropdown(): void {
  const selector = $("#stationSelect");
  selector.empty();
  logInfo("Populating dropdown with " + stations.length + " stations");
  stations.forEach((stn) => {
    const option = $("<option>").text(stn.name).val(stn.abbr);
    if (stn.abbr === currentStation) {
      option.attr("selected", "selected");
    }
    selector.append(option);
  });
}

function ajaxQuery(): void {
  if (!apiBase) {
    if (!warnedNoProxy) {
      warnedNoProxy = true;
      logError(
        "No API proxy configured for GitHub Pages. Use local dev server or set window.BART_PROXY_BASE."
      );
    }
    return;
  }

  const u = `${apiBase}/api/etd?orig=${currentStation}`;
  logInfo("Requesting " + u);
  $.ajax({
    url: u,
    method: "GET"
  })
    .then((response: BartResponse) => {
      $("#Platform1").empty();
      $("#Platform2").empty();

      const stationData = response?.root?.station?.[0];
      if (!stationData) {
        logError("Invalid API response");
        console.error("Invalid API response", response);
        return;
      }

      if (!stationData.etd || stationData.etd.length === 0) {
        $("#Platform1")
          .append($("<p>").addClass("minutes-text").text("No upcoming trains"));
        logInfo("No upcoming trains");
        return;
      }

      const etds = stationData.etd;
      for (let i = 0; i < etds.length; i++) {
        const dest = etds[i].destination;
        const estimatesRaw = etds[i].estimate;
        const estimates = Array.isArray(estimatesRaw)
          ? estimatesRaw
          : [estimatesRaw];

        const min: string[] = [];
        let bartPlatform = "";
        for (let e = 0; e < estimates.length; e++) {
          min.push(estimates[e].minutes);
          bartPlatform = estimates[e].platform;
        }
        const divTag = $("<div>").addClass("dest-name text-left").text(dest);
        const pTag = $("<p>")
          .addClass("minutes-text")
          .text(`Mins: ${min.join(", ")}`);
        if (bartPlatform === "1") {
          $("#Platform1").append(divTag).append(pTag);
        } else {
          $("#Platform2").append(divTag).append(pTag);
        }
      }
    })
    .fail((err: unknown) => {
      logError("API Request Failed");
      console.error("API Request Failed", err);
    });
}

function updateRefreshUI(): void {
  const progress = $("#refreshProgress");
  const text = $("#refreshSeconds");
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, remainingSeconds / refreshSeconds));
  const offset = circumference * (1 - ratio);

  progress.attr("stroke-dasharray", String(circumference));
  progress.attr("stroke-dashoffset", String(offset));
  text.text(`${remainingSeconds}s`);
}

function resetRefreshTimer(triggerFetch: boolean): void {
  remainingSeconds = refreshSeconds;
  updateRefreshUI();
  $(".refresh-badge").addClass("refresh-pulse");
  window.setTimeout(() => {
    $(".refresh-badge").removeClass("refresh-pulse");
  }, 400);
  if (triggerFetch) {
    ajaxQuery();
  }
}

function logInfo(message: string): void {
  appendLog("INFO", message);
}

function logError(message: string): void {
  appendLog("ERROR", message);
}

function appendLog(level: "INFO" | "ERROR", message: string): void {
  logSeq += 1;
  const timestamp = new Date().toLocaleTimeString();
  const panel = $("#logPanel");
  const line = $("<div>").addClass("log-line");
  const tag = $("<span>").addClass("log-tag").text(level);
  const text = $("<span>").text(`[${timestamp}] ${message}`);
  line.append(tag).append(text);
  panel.prepend(line);
  if (panel.children().length > 50) {
    panel.children().last().remove();
  }
}

$(document).ready(() => {
  populateDropdown();
  updateRefreshUI();
  ajaxQuery();

  $("#stationSelect").on("change", function () {
    const nextStation = $(this).val();
    currentStation = typeof nextStation === "string" ? nextStation : currentStation;
    logInfo("Station changed to " + currentStation);
    resetRefreshTimer(true);
  });

  refreshTimer = window.setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      resetRefreshTimer(true);
      return;
    }
    updateRefreshUI();
  }, 1000);

  $("#clearLogs").on("click", () => {
    $("#logPanel").empty();
    logSeq = 0;
  });
});
