package captiveportal::PacketFence::DynamicRouting::Module::Authentication::SSL_Inspection;

=head1 NAME

captiveportal::DynamicRouting::Module::Authentication::SSL_Inspection

=head1 DESCRIPTION

SSL Inspection module

=cut

use Moose;
extends 'captiveportal::DynamicRouting::Module::Authentication';
with 'captiveportal::Role::Routed';


use Tie::IxHash;
use pf::log;
use List::Util qw(first);
use pf::config;
use pf::violation;
use pf::config::violation;
use pf::config::util;
use pf::web::guest;
use pf::util;
use pf::node;
use pf::constants;

has '+route_map' => (default => sub {
    tie my %map, 'Tie::IxHash', (
        '/ssl_inspection/ios' => \&ios,
        '/ssl_inspection/android' => \&android,
        '/ssl_inspection/xos' => \&xos,
        '/ssl_inspection/windows' => \&windows,
        '/ssl_inspection/chrome' => \&chrome,
        '/ssl_inspection/firefox' => \&firefox,
        '/ssl_inspection/opera' => \&opera,
        '/ssl_inspection/unsupported' => \&unsupported,
        # fallback to the index
        '/captive-portal' => \&index,
    );
    return \%map;
});

=head2 index

Present 

=cut

sub index {
    my ($self) = @_;

    $self->render('ssl_inspection/index.html', {
        title => "Download Certificate for your platform",
    });
}


=head2 ios

ios

=cut

sub ios {
    my ($self) = @_;

    $self->render('ssl_inspection/ios.html', {
         title => "iOS",
    });
}

=head2 android

android

=cut

sub android {
    my ($self) = @_;

    $self->render('ssl_inspection/android.html', {
         title => "Android",
    });
}

=head2 xos

xos

=cut

sub xos {
    my ($self) = @_;

    $self->render('ssl_inspection/xos.html', {
         title => "xos",
    });
}

=head2 windows

Windows

=cut

sub android {
    my ($self) = @_;

    $self->render('ssl_inspection/windows.html', {
         title => "Windows",
         message => "Success Windows",
    });
}

=head2 chrome

chrome

=cut

sub ios {
    my ($self) = @_;

    $self->render('ssl_inspection/chrome.html', {
         title => "Chrome OS",
    });
}

=head2 firefox

Firefox

=cut

sub android {
    my ($self) = @_;

    $self->render('ssl_inspection/firefox.html', {
         title => "firefox",
    });
}

=head2 opera

Opera

=cut

sub xos {
    my ($self) = @_;

    $self->render('ssl_inspection/opera.html', {
         title => "Opera",
    });
}

=head2 unsupported

unsupported

=cut

sub android {
    my ($self) = @_;

    $self->render('ssl_inspection/unsupported.html', {
         title => "unsupported",
    });
}

=head1 AUTHOR

Inverse inc. <info@inverse.ca>

=head1 COPYRIGHT

Copyright (C) 2005-2018 Inverse inc.

=head1 LICENSE

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
USA.

=cut

__PACKAGE__->meta->make_immutable unless $ENV{"PF_SKIP_MAKE_IMMUTABLE"};

1;

