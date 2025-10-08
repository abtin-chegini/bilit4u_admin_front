"use client";

/**
 * Example of how to integrate the Checkout component into your PDP flow
 * 
 * This example shows:
 * 1. How to fetch ticket details
 * 2. How to navigate from passenger form to checkout
 * 3. How to handle the checkout flow
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BusReservationWithFlow from "@/components/dashboard_admin_buy/pdp/previous/bus_reservation/BusReservationWithFlow";
import { Checkout } from "@/components/dashboard_admin_buy/pdp/previous/checkout/checkout";
import { ServiceDetails } from "@/components/dashboard_admin_buy/pdp/previous/ticket-card-lg/index";
import { useTicketStore } from "@/store/TicketStore";

// This is an example component showing the complete flow
export const PDPCheckoutFlow: React.FC = () => {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<"selection" | "checkout">("selection");
	const [ticketDetails, setTicketDetails] = useState<ServiceDetails | null>(null);
	const { ticketId, token } = useTicketStore();

	// Fetch ticket details on mount
	useEffect(() => {
		const fetchTicketDetails = async () => {
			try {
				// Replace with your actual API endpoint
				const response = await fetch(`https://api.bilit4u.com/admin/api/v1/tickets/${ticketId}`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				});

				if (response.ok) {
					const data = await response.json();
					setTicketDetails(data.ticket);
				}
			} catch (error) {
				console.error("Error fetching ticket details:", error);
			}
		};

		if (ticketId && token) {
			fetchTicketDetails();
		}
	}, [ticketId, token]);

	// Handle navigation to checkout after passengers are saved
	const handleContinueToCheckout = () => {
		console.log("Navigating to checkout step");
		setCurrentStep("checkout");
	};

	// Handle back navigation from checkout
	const handleBackToSelection = () => {
		console.log("Navigating back to seat selection");
		setCurrentStep("selection");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{currentStep === "selection" ? (
				// Step 1: Seat selection and passenger details
				<BusReservationWithFlow
					onContinue={handleContinueToCheckout}
					hideContinueButton={false}
				/>
			) : (
				// Step 2: Checkout
				ticketDetails && (
					<Checkout
						ticketDetails={ticketDetails}
						onBack={handleBackToSelection}
					/>
				)
			)}
		</div>
	);
};

export default PDPCheckoutFlow;

/**
 * Alternative approach: Using URL routing
 *
 * If you prefer to use Next.js routing instead of state management:
 */

// File: app/ticket/[token]/[ticketId]/checkout/page.tsx
/*
"use client";

import { useParams, useRouter } from "next/navigation";
import { Checkout } from "@/components/dashboard_admin_buy/pdp/previous/checkout/checkout";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [ticketDetails, setTicketDetails] = useState(null);

  useEffect(() => {
    // Fetch ticket details using params.token and params.ticketId
    const fetchDetails = async () => {
      const response = await fetch(
	`https://api.bilit4u.com/admin/api/v1/tickets/${params.ticketId}`,
	{
	  headers: {
	    'Authorization': `Bearer ${params.token}`,
	  }
	}
      );
      const data = await response.json();
      setTicketDetails(data.ticket);
    };

    fetchDetails();
  }, [params]);

  const handleBack = () => {
    router.back();
  };

  if (!ticketDetails) {
    return <div>Loading...</div>;
  }

  return <Checkout ticketDetails={ticketDetails} onBack={handleBack} />;
}
*/

/**
 * Integration with your existing BusReservationWithFlow:
 * 
 * Modify the handleContinueClick in BusReservationWithFlow to navigate to checkout:
 */

/*
const handleContinueClick = async () => {
  // ... existing validation code ...
  
  const result = await savePassengerData();
  
  if (result.success) {
    // Option 1: Using state (as shown in PDPCheckoutFlow above)
    if (onContinue) {
      onContinue(selectedSeats);
    }
    
    // Option 2: Using router
    router.push(`/ticket/${token}/${ticketId}/checkout`);
  }
};
*/
