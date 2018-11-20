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
	var err error
	a.DB, err = db.DbFromConfig(ctx, options)
	sharedutils.CheckError(err)
	a.Router = mux.NewRouter()
	a.initializeRoutes()
}

func (a *App) initializeRoutes() {

	a.Router.HandleFunc("/api/v1/dhcp/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", a.handleMac2Ip).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", a.handleReleaseIP).Methods("DELETE")
	a.Router.HandleFunc("/api/v1/dhcp/ip/{ip:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", a.handleIP2Mac).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/stats", a.handleAllStats).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/stats/{int:.*}/{network:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", a.handleStats).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/stats/{int:.*}", a.handleStats).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/debug/{int:.*}/{role:(?:[^/]*)}", a.handleDebug).Methods("GET")
	a.Router.HandleFunc("/api/v1/dhcp/options/network/{network:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", a.handleOverrideNetworkOptions).Methods("POST")
	a.Router.HandleFunc("/api/v1/dhcp/options/network/{network:(?:[0-9]{1,3}.){3}(?:[0-9]{1,3})}", a.handleRemoveNetworkOptions).Methods("DELETE")
	a.Router.HandleFunc("/api/v1/dhcp/options/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", a.handleOverrideOptions).Methods("POST")
	a.Router.HandleFunc("/api/v1/dhcp/options/mac/{mac:(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}}", a.handleRemoveOptions).Methods("DELETE")
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
