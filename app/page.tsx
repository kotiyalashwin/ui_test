"use client";

import Link from "next/link";
import { act, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Active {
	id: string;
	preview: string;
}
interface CommandState {
	input: string;
	output: string;
	loading: boolean;
}
export default function Home() {
	const [actives, setActives] = useState<Active[]>([]);
	const [loading, setLoading] = useState(false);
	const [stoppingIds, setStoppingIds] = useState<Set<string>>(new Set());
	const [commandStates, setCommandStates] = useState<
		Record<string, CommandState>
	>({});

	const handleSpawn = async () => {
		setLoading(true);
		try {
			const response = await fetch("https://runable.woksh.com/spawn", {
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
			await fetch(`https://runable.woksh.com/stop/${id}`, {
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
	const handleExecuteCommand = async (id: string) => {
		const command = commandStates[id]?.input || "";
		if (!command.trim()) return;

		setCommandStates((prev) => ({
			...prev,
			[id]: { ...prev[id], loading: true, output: "" },
		}));

		try {
			const response = await fetch(`https://runable.woksh.com/exec/${id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ command }),
			});
			const data = await response.json();
			setCommandStates((prev) => ({
				...prev,
				[id]: { ...prev[id], output: data.output || "", loading: false },
			}));
		} catch (error) {
			console.error("Error executing command:", error);
			setCommandStates((prev) => ({
				...prev,
				[id]: {
					...prev[id],
					output: "Error executing command",
					loading: false,
				},
			}));
		}
	};

	const handleCommandInputChange = (id: string, value: string) => {
		setCommandStates((prev) => ({
			...prev,
			[id]: { ...prev[id], input: value },
		}));
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
							<div key={active.id} className="space-y-3">
								<Card key={active.id} className="p-4">
									<div className="flex items-center justify-between">
										<div className="overflow-hidden">
											<p className="font-semibold mask-r-from-20%">
												ID: {active.id}
											</p>
											<p className="text-sm text-muted-foreground">
												{active.preview}
											</p>
										</div>
										<div className="flex gap-2">
											<Link href={`http://${active.preview}`} target="_blank">
												<Button variant="outline">Preview</Button>
											</Link>
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
								<Card className="p-4 bg-muted/50">
									<div className="space-y-3">
										<div className="flex gap-2">
											<Input
												placeholder="Enter command (e.g., ls -a)"
												value={commandStates[active.id]?.input || ""}
												onChange={(e) =>
													handleCommandInputChange(active.id, e.target.value)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														handleExecuteCommand(active.id);
													}
												}}
											/>
											<Button
												onClick={() => handleExecuteCommand(active.id)}
												disabled={
													commandStates[active.id]?.loading ||
													!commandStates[active.id]?.input?.trim()
												}
											>
												{commandStates[active.id]?.loading
													? "Sending..."
													: "Send"}
											</Button>
										</div>

										{commandStates[active.id]?.output && (
											<div className="bg-background rounded p-3 border">
												<p className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
													{commandStates[active.id].output}
												</p>
											</div>
										)}
									</div>
								</Card>
							</div>
						))
					)}
				</div>
			</div>
		</main>
	);
}
