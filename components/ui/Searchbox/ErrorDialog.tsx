"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter
} from "@/components/ui/dialog";

interface ErrorDialogProps {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	errorTitle: string;
	setIsSearching: (value: boolean) => void;
}

export default function ErrorDialog({
	isOpen,
	setIsOpen,
	errorTitle,
	setIsSearching
}: ErrorDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => {
			setIsOpen(open);
			if (!open) setIsSearching(false);
		}}>
			<DialogContent>
				<DialogHeader className="flex flex-row justify-center">
					<DialogTitle className="text-red-400 text-right font-IranYekanRegular mt-4">
						{errorTitle}
					</DialogTitle>
				</DialogHeader>
				<DialogFooter className="flex flex-row justify-start">
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}