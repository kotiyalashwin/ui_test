"use client";

import { act, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Active {
	id: string;
	preview: string;
}

export default function Home() {
	const [actives, setActives] = useState<Active[]>([]);
	const [loading, setLoading] = useState(false);
	const [stoppingIds, setStoppingIds] = useState<Set<string>>(new Set());

	const handleSpawn = async () => {
		setLoading(true);
		try {
			const response = await fetch("http://runable.woksh.com:3000/spawn", {
				method: "POST",
			});
			const data = await response.json();
			setActives([...actives, { id: data.id, preview: data.preview }]);
		} catch (error) {
			console.error("Error spawning container:", error);
		} finally {
			setLoading(false);
		}
	};


	const handleStop = async (id: string) => {
		setStoppingIds((prev) => new Set(prev).add(id));
		try {
			await fetch(`http://runable.woksh.com:3000/stop/${id}`, {
				method: "POST",
			});
			setActives(actives.filter((active) => active.id !== id));
		} catch (error) {
			console.error("Error stopping container:", error);
		} finally {
			setStoppingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	return (
		<main className="min-h-screen bg-background p-8">
			<div className="max-w-2xl mx-auto">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-4">Container Manager</h1>
					<Button onClick={handleSpawn} disabled={loading}>
						{loading ? "Spawning..." : "Spawn Container"}
					</Button>
				</div>

				<div className="space-y-4">
					{actives.length === 0 ? (
						<p className="text-muted-foreground">No active containers</p>
					) : (
						actives.map((active) => (
							<Card key={active.id} className="p-4">
								<div className="flex items-center justify-between">
									<div className="overflow-hidden">
										<p className="font-semibold mask-r-from-20%">ID: {active.id}</p>
										<p className="text-sm text-muted-foreground">
											{active.preview}
										</p>
									</div>
									<div className="flex gap-2">
										<a href={active.preview} target="_blank">
											<Button variant="outline">Preview</Button>
										</a>
										<Button
											variant="destructive"
											onClick={() => handleStop(active.id)}
											disabled={stoppingIds.has(active.id)}
										>
											{stoppingIds.has(active.id) ? "Stopping..." : "Stop"}
										</Button>
									</div>
								</div>
							</Card>
						))
					)}
				</div>
			</div>
		</main>
	);
}
