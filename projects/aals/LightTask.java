import org.firmata4j.IODevice;
import org.firmata4j.Pin;
import org.firmata4j.ssd1306.SSD1306;
import org.knowm.xchart.SwingWrapper;
import org.knowm.xchart.XYChart;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;


/**
 * The class run by my timer task
 */
public class LightTask extends TimerTask {

    HashMap<String, Pin> pins;
    Timer timer;
    SSD1306 oled;
    IODevice board;
    XYChart chart;
    SwingWrapper<XYChart> sw;
    ArrayList<Double> timeData;
    ArrayList<Double> lightData;
    double maxLight = 0.1;

    /**
     * @param pins the pins hashmap that allows me to retrieve values
     * @param timer the timer object (so that I can stop it if the button is pressed
     * @param oled the oled object for printing to the display
     * @param board the board object so that I can stop it
     * @param chart the chart object so I can add x and y values to it
     * @param sw the swingwrapper object, for displaying
     * @param timeData the arraylist object for storing x values on the graph
     * @param lightData the light data of the past 30 seconds stored in this arraylist (1 value for every 0.5 seconds)
     */
    LightTask(HashMap<String, Pin> pins, Timer timer, SSD1306 oled, IODevice board, XYChart chart, SwingWrapper<XYChart> sw, ArrayList<Double> timeData, ArrayList<Double> lightData) {
        this.pins = pins;
        this.timer = timer;
        this.oled = oled;
        this.board = board;
        this.chart = chart;
        this.sw = sw;
        this.lightData = lightData;
        this.timeData = timeData;

        // determining if the light needs to start on or off
        if (lightData.getFirst() < potVoltage(pins.get("potentiometer").getValue(), maxLight)) {
            try {
                pins.get("led").setValue(1);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        } else {
            try {
                pins.get("led").setValue(0);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    /**
     * Method for turning on the lights
     * Tt turns the led on, and activates the buzzer for 0.3 seconds
     * End with sending a message to your phone number, notifying you of this event
     */
    public void turnOnLights() {
        try {
            pins.get("led").setValue(1); // turn on the lights

            pins.get("buzzer").setValue(1); // turn on the buzzer
            Thread.sleep(300); // sleep for 0.3 seconds
            pins.get("buzzer").setValue(0); // turn off the buzzer
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }

        try {
            MessageSend.sendSMS("Turning on the lights."); // send off message to user's phone
        } catch (Exception _) { }
    }

    void turnOffLights() {
        try {
            pins.get("led").setValue(0); // turn off light

            pins.get("buzzer").setValue(1); // turn on buzzer
            Thread.sleep(300); // sleep for 0.3 seconds
            pins.get("buzzer").setValue(0); // turn off buzzer
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }

        try {
            MessageSend.sendSMS("Turning off the lights."); // send off message to user's phone
        } catch (Exception _) {}
    }

    /**
     * @param currentValue the current value of the potentiometer
     * @param maxVoltage the highest light voltage recorded
     * @return current raw voltage value of the potentiometer
     */
    public static double potVoltage(double currentValue, double maxVoltage) {
        return currentValue * (maxVoltage/1023); // compute value of the raw voltage being recorded
    }

    /**
     * The method run by the timer task
     */
    @Override
    public void run() {
        if (pins.get("button").getValue() != 0) {
            try {
                LightApp.stopApp(board, oled, pins); // run the stop app method in the LightApp class
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            timer.cancel(); // cancel timer
        } else {
            double lightVoltage = LightApp.lightVoltage(pins.get("light").getValue()); // save the current light voltage value using my raw voltage method

            if ((lightVoltage*0.9) > (maxLight)) {
                maxLight = lightVoltage*0.9;
            }


            timeData.add(timeData.getLast() + 0.5); // update time value
            lightData.add(lightVoltage); //save light value to arraylist

            double potVoltage = potVoltage(pins.get("potentiometer").getValue(), maxLight); // using this max light voltage as the maximum threshold value, determine the threshold value
            System.out.printf("Time: %.2f Light Intensity: %.2f Threshold: %.2f\n",timeData.getLast(),lightVoltage, potVoltage); // print all data collected to console

            String oledString = String.format("Light Intensity: %.2f\nTime: %.2f\nPotentiometer: %.2f", lightVoltage, timeData.getLast(),potVoltage); // create string usable on the OLED
            oled.getCanvas().drawString(0,0,oledString);
            oled.display(); // display to oled

            chart.updateXYSeries("light", timeData, lightData, null); // update chart series
            sw.repaintChart(); // request swingwrapper to update chart

            // turn on or off the light if the light voltage minus the threshold value changes from positive to negative or vice versa
            if ((lightData.getLast() - potVoltage) < 0 && ((lightData.get(lightData.size() - 2) - potVoltage) > 0)) {
                turnOnLights();
                System.out.println("Turning on lights");
            } else if ((lightData.getLast() - potVoltage) > 0 && ((lightData.get(lightData.size() - 2)) - potVoltage) < 0){
                turnOffLights();
                System.out.println("Turning off lights");
            }

            // restrict the size of the time data and the light data, to 60 values (30 seconds)
            if (timeData.size() > 60) {
                timeData.removeFirst();
                lightData.removeFirst();
            }
        }
    }
}
