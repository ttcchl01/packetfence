package main

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/goji/httpauth"
	"github.com/gorilla/mux"
	"github.com/inverse-inc/packetfence/go/db"
	"github.com/inverse-inc/packetfence/go/pfconfigdriver"
	"github.com/inverse-inc/packetfence/go/sharedutils"
)

type App struct {
	Router *mux.Router
	DB     *sql.DB
}

func (a *App) Initialize(configDatabase pfconfigdriver.PfConfDatabase) {
	options := "timeout=90s&readTimeout=30s"
	db, err := db.DbFromConfig(ctx, options)
	sharedutils.CheckError(err)
	MySQLdatabase = db
	a.Router = mux.NewRouter()
	a.initializeRoutes()
}

func (a *App) initializeRoutes() {

	a.Router.HandleFunc("/api/v1/dhcp/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", handleMac2Ip).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", handleReleaseIP).Methods("DELETE")
	a.Router.HandleFunc("/api/v1/dhcp/ip/{ip:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", handleIP2Mac).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/stats", handleAllStats).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/stats/{int:.*}/{network:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", handleStats).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/stats/{int:.*}", handleStats).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/debug/{int:.*}/{role:(?:[^/]*)}", handleDebug).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/options/network/{network:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", handleOverrideNetworkOptions).Methods("POST")
	a.Router.HandleFunc("/api/v1/dhcp/options/network/{network:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", handleRemoveNetworkOptions).Methods("DELETE")
	a.Router.HandleFunc("/api/v1/dhcp/options/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", handleOverrideOptions).Methods("POST")
	a.Router.HandleFunc("/api/v1/dhcp/options/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", handleRemoveOptions).Methods("DELETE")
	http.Handle("/", httpauth.SimpleBasicAuth(webservices.User, webservices.Pass)(a.Router))
}

func (a *App) Run() {
	srv := &http.Server{
		Addr:         "127.0.0.1:22222",
		IdleTimeout:  5 * time.Second,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		Handler:      a.Router,
	}
	srv.ListenAndServe()
}
